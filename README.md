# Magic Inspector

Magic Inspector is a privacy-first desktop and Android network inspector. It checks IP, DNS, WebRTC, IPv6, proxy signals, blacklist reputation, AI/streaming reachability and connection quality.

## v1.1 network quality test

The quality test runs against Cloudflare's edge network and reports idle latency, jitter, download/upload throughput and loaded latency. It uses adaptive request sizes, streams data, has a hard traffic budget and does not call Cloudflare's result-reporting endpoint. A normal test takes about 12–20 seconds and usually transfers 20–100 MB.

The quality score is separate from the safety score. Magic Inspector intentionally does not label HTTPS request failures as packet loss; real UDP loss will require a future dedicated TURN service.

## Privacy and history

Detection runs locally. Public IP and network results may be stored in the local history list (up to 20 reports) when a run completes. History can be deleted at any time and is never synced or uploaded.

## Downloads

Download Windows EXE/MSI, macOS Universal DMG and Android APK from [GitHub Releases](https://github.com/AO-qifengle/magic-inspector/releases). Desktop artifacts are currently unsigned; the Android artifact is signed by the release workflow.

## Development

```sh
npm ci
npm run dev
npm run test
npm run lint
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

## Shared package

`@ao-qifengle/magic-inspector-core` contains reusable WebRTC classification and quality-scoring primitives. It is published to GitHub Packages and contains no network client.

```sh
npm install @ao-qifengle/magic-inspector-core --registry=https://npm.pkg.github.com
```

## References

The measurement approach is informed by the MIT-licensed [Cloudflare Speedtest](https://github.com/cloudflare/speedtest). LibreSpeed and M-Lab NDT7 were reviewed as protocol references; no GPL source is included.
