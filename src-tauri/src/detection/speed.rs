//! 基于 Cloudflare 边缘端点的网络质量测试。
//!
//! 这里只使用下载/上传测试端点，不调用 Cloudflare 的结果上报接口。测速请求采用
//! 流式读写和硬流量上限，避免在桌面或 Android 设备上分配几十 MB 的连续内存。

use super::{RiskLevel, SpeedAssessment, SpeedMetrics, SpeedReport, SpeedUseCase};
use crate::detection::http;
use bytes::Bytes;
use futures_util::{stream, StreamExt};
use reqwest::Client;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const DOWN_URL: &str = "https://speed.cloudflare.com/__down";
const UP_URL: &str = "https://speed.cloudflare.com/__up";
const LATENCY_SAMPLES: usize = 12;
const MAX_DOWNLOAD_BYTES: u64 = 80 * 1024 * 1024;
const MAX_UPLOAD_BYTES: u64 = 40 * 1024 * 1024;
const PHASE_TIMEOUT: Duration = Duration::from_secs(7);

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SpeedProgress {
    pub phase: String,
    pub progress: u8,
    pub mbps: Option<f64>,
    pub bytes: u64,
}

#[derive(Debug, Clone)]
struct DirectionResult {
    mbps: Option<f64>,
    loaded_latency_ms: Option<f64>,
    bytes: u64,
}

pub async fn run<F>(cancel: Arc<AtomicBool>, mut emit: F) -> SpeedReport
where
    F: FnMut(SpeedProgress) + Send,
{
    let started = Instant::now();
    let client = http::client_with_timeout(Duration::from_secs(15));
    let mut metrics = SpeedMetrics {
        status: "running".to_string(),
        latency_ms: None,
        jitter_ms: None,
        download_mbps: None,
        upload_mbps: None,
        download_loaded_latency_ms: None,
        upload_loaded_latency_ms: None,
        bytes_downloaded: 0,
        bytes_uploaded: 0,
        duration_ms: 0,
        error: None,
    };

    let latency = measure_latency(&client, &cancel, &mut emit).await;
    metrics.latency_ms = latency.0;
    metrics.jitter_ms = latency.1;

    if !cancel.load(Ordering::Relaxed) {
        let down = measure_direction(
            &client,
            "download",
            false,
            MAX_DOWNLOAD_BYTES,
            &cancel,
            &mut emit,
        )
        .await;
        metrics.download_mbps = down.mbps;
        metrics.download_loaded_latency_ms = down.loaded_latency_ms;
        metrics.bytes_downloaded = down.bytes;
    }
    if !cancel.load(Ordering::Relaxed) {
        let up = measure_direction(
            &client,
            "upload",
            true,
            MAX_UPLOAD_BYTES,
            &cancel,
            &mut emit,
        )
        .await;
        metrics.upload_mbps = up.mbps;
        metrics.upload_loaded_latency_ms = up.loaded_latency_ms;
        metrics.bytes_uploaded = up.bytes;
    }

    metrics.duration_ms = started.elapsed().as_millis() as u64;
    let completed = metrics.latency_ms.is_some()
        && metrics.download_mbps.is_some()
        && metrics.upload_mbps.is_some();
    metrics.status = if cancel.load(Ordering::Relaxed) {
        "cancelled".to_string()
    } else if completed {
        "complete".to_string()
    } else {
        "partial".to_string()
    };
    if metrics.status != "complete" && metrics.error.is_none() {
        metrics.error = Some("speed.partial".to_string());
    }

    SpeedReport {
        provider: "cloudflare".to_string(),
        assessment: assess(&metrics),
        metrics,
    }
}

async fn measure_latency<F>(
    client: &Client,
    cancel: &Arc<AtomicBool>,
    emit: &mut F,
) -> (Option<f64>, Option<f64>)
where
    F: FnMut(SpeedProgress),
{
    let mut points = Vec::with_capacity(LATENCY_SAMPLES);
    for i in 0..LATENCY_SAMPLES {
        if cancel.load(Ordering::Relaxed) {
            break;
        }
        let now = cache_buster();
        let started = Instant::now();
        let result = tokio::time::timeout(
            Duration::from_secs(2),
            client.get(format!("{DOWN_URL}?bytes=0&mi={now}")).send(),
        )
        .await;
        if let Ok(Ok(resp)) = result {
            if resp.status().is_success() {
                let _ = resp.bytes().await;
                points.push(started.elapsed().as_secs_f64() * 1000.0);
            }
        }
        emit(SpeedProgress {
            phase: "latency".to_string(),
            progress: (((i + 1) * 100) / LATENCY_SAMPLES) as u8,
            mbps: None,
            bytes: 0,
        });
    }
    if points.is_empty() {
        return (None, None);
    }
    let latency = percentile(&points, 0.5);
    let jitter = if points.len() < 2 {
        None
    } else {
        Some(
            points.windows(2).map(|p| (p[1] - p[0]).abs()).sum::<f64>() / (points.len() - 1) as f64,
        )
    };
    (Some(latency), jitter)
}

async fn measure_direction<F>(
    client: &Client,
    phase: &str,
    upload: bool,
    max_bytes: u64,
    cancel: &Arc<AtomicBool>,
    emit: &mut F,
) -> DirectionResult
where
    F: FnMut(SpeedProgress),
{
    let rounds: &[(usize, u64)] = if upload {
        &[
            (4, 100_000),
            (4, 1_000_000),
            (4, 5_000_000),
            (2, 10_000_000),
        ]
    } else {
        &[
            (4, 100_000),
            (4, 1_000_000),
            (4, 10_000_000),
            (2, 25_000_000),
        ]
    };
    let phase_started = Instant::now();
    let sampling_done = Arc::new(AtomicBool::new(false));
    let sample_cancel = Arc::clone(cancel);
    let sample_done = Arc::clone(&sampling_done);
    let sample_client = client.clone();
    let sample_phase = phase.to_string();
    let sampler = tokio::spawn(async move {
        let mut samples = Vec::new();
        while !sample_done.load(Ordering::Relaxed) && !sample_cancel.load(Ordering::Relaxed) {
            let started = Instant::now();
            let response = tokio::time::timeout(
                Duration::from_secs(2),
                sample_client
                    .get(format!("{DOWN_URL}?bytes=0&mi={}", cache_buster()))
                    .send(),
            )
            .await;
            if let Ok(Ok(resp)) = response {
                if resp.status().is_success() {
                    let _ = resp.bytes().await;
                    samples.push(started.elapsed().as_secs_f64() * 1000.0);
                }
            }
            tokio::time::sleep(Duration::from_millis(400)).await;
        }
        (sample_phase, samples)
    });

    let mut values = Vec::new();
    let mut transferred = 0u64;
    for (round_index, (count, size)) in rounds.iter().enumerate() {
        if cancel.load(Ordering::Relaxed) || phase_started.elapsed() >= PHASE_TIMEOUT {
            break;
        }
        let available = max_bytes.saturating_sub(transferred);
        let actual_count = (*count).min((available / *size) as usize);
        if actual_count == 0 {
            break;
        }
        let mut jobs = Vec::with_capacity(actual_count);
        for _ in 0..actual_count {
            let c = client.clone();
            let cancelled = Arc::clone(cancel);
            jobs.push(tokio::spawn(async move {
                if cancelled.load(Ordering::Relaxed) {
                    return None;
                }
                let started = Instant::now();
                tokio::time::timeout(PHASE_TIMEOUT, async {
                    if upload {
                        upload_request(&c, *size).await
                    } else {
                        download_request(&c, *size).await
                    }
                })
                .await
                .ok()
                .flatten()
                .map(|bytes| (bytes, started.elapsed()))
            }));
        }
        for job in jobs {
            if let Ok(Some((bytes, elapsed))) = job.await {
                if elapsed >= Duration::from_millis(10) && bytes > 0 {
                    values.push((bytes as f64 * 8.0) / elapsed.as_secs_f64());
                    transferred = transferred.saturating_add(bytes);
                }
            }
        }
        let progress = (((round_index + 1) * 100) / rounds.len()) as u8;
        emit(SpeedProgress {
            phase: phase.to_string(),
            progress,
            mbps: (!values.is_empty()).then(|| percentile(&values, 0.9) / 1_000_000.0),
            bytes: transferred,
        });
    }
    sampling_done.store(true, Ordering::Relaxed);
    let (_, loaded_points) = sampler.await.unwrap_or_default();
    DirectionResult {
        mbps: (!values.is_empty()).then(|| percentile(&values, 0.9) / 1_000_000.0),
        loaded_latency_ms: (!loaded_points.is_empty()).then(|| percentile(&loaded_points, 0.5)),
        bytes: transferred,
    }
}

async fn download_request(client: &Client, bytes: u64) -> Option<u64> {
    let resp = client
        .get(format!("{DOWN_URL}?bytes={bytes}&mi={}", cache_buster()))
        .send()
        .await
        .ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let mut stream = resp.bytes_stream();
    let mut total = 0u64;
    while let Some(chunk) = stream.next().await {
        total = total.saturating_add(chunk.ok()?.len() as u64);
    }
    Some(total)
}

async fn upload_request(client: &Client, bytes: u64) -> Option<u64> {
    let chunk = Bytes::from(vec![0u8; 64 * 1024]);
    let count = (bytes / chunk.len() as u64) as usize;
    let remainder = (bytes % chunk.len() as u64) as usize;
    let body_stream = stream::iter(
        (0..count).map(move |_| Ok::<Bytes, std::io::Error>(chunk.clone())),
    )
    .chain(stream::iter((remainder > 0).then(|| {
        Ok::<Bytes, std::io::Error>(Bytes::from(vec![0u8; remainder]))
    })));
    let body = reqwest::Body::wrap_stream(body_stream);
    let resp = client
        .post(format!("{UP_URL}?mi={}", cache_buster()))
        .body(body)
        .send()
        .await
        .ok()?;
    if resp.status().is_success() || resp.status().is_client_error() {
        Some(bytes)
    } else {
        None
    }
}

fn percentile(values: &[f64], p: f64) -> f64 {
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let index = ((sorted.len() - 1) as f64 * p).round() as usize;
    sorted[index.min(sorted.len() - 1)]
}

fn cache_buster() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos()
}

fn assess(metrics: &SpeedMetrics) -> SpeedAssessment {
    let latency = metrics.latency_ms.unwrap_or(999.0);
    let jitter = metrics.jitter_ms.unwrap_or(999.0);
    let down = metrics.download_mbps.unwrap_or(0.0);
    let up = metrics.upload_mbps.unwrap_or(0.0);
    let down_loaded = metrics.download_loaded_latency_ms.unwrap_or(999.0);
    let up_loaded = metrics.upload_loaded_latency_ms.unwrap_or(999.0);
    let scores = vec![
        use_case(
            "browsing",
            weighted_score(&[(down, 10.0, true), (latency, 150.0, false)]),
        ),
        use_case(
            "streaming4k",
            weighted_score(&[(down, 25.0, true), (down_loaded, 200.0, false)]),
        ),
        use_case(
            "video_call",
            weighted_score(&[
                (down, 10.0, true),
                (up, 5.0, true),
                (jitter, 30.0, false),
                (up_loaded, 200.0, false),
            ]),
        ),
        use_case(
            "gaming",
            weighted_score(&[
                (latency, 60.0, false),
                (jitter, 15.0, false),
                (down_loaded, 120.0, false),
            ]),
        ),
    ];
    let score = (scores.iter().map(|s| s.score as u16).sum::<u16>() / scores.len() as u16) as u8;
    SpeedAssessment {
        score,
        level: level(score),
        use_cases: scores,
    }
}

fn use_case(id: &str, score: u8) -> SpeedUseCase {
    SpeedUseCase {
        id: id.to_string(),
        score,
        level: level(score),
    }
}

fn weighted_score(values: &[(f64, f64, bool)]) -> u8 {
    if values.is_empty() {
        return 0;
    }
    let sum = values
        .iter()
        .map(|(value, target, higher_is_better)| {
            let ratio = if *higher_is_better {
                value / target
            } else {
                target / value.max(0.1)
            };
            (ratio.min(1.0) * 100.0) as u16
        })
        .sum::<u16>();
    (sum / values.len() as u16).min(100) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn percentile_uses_sorted_samples() {
        assert_eq!(percentile(&[30.0, 10.0, 20.0], 0.5), 20.0);
    }

    #[test]
    fn quality_score_rewards_fast_connection() {
        let metrics = SpeedMetrics {
            status: "complete".into(),
            latency_ms: Some(20.0),
            jitter_ms: Some(2.0),
            download_mbps: Some(100.0),
            upload_mbps: Some(40.0),
            download_loaded_latency_ms: Some(40.0),
            upload_loaded_latency_ms: Some(40.0),
            bytes_downloaded: 1,
            bytes_uploaded: 1,
            duration_ms: 1,
            error: None,
        };
        assert!(assess(&metrics).score >= 80);
    }
}

fn level(score: u8) -> RiskLevel {
    if score >= 80 {
        RiskLevel::Ok
    } else if score >= 55 {
        RiskLevel::Warn
    } else {
        RiskLevel::Risk
    }
}
