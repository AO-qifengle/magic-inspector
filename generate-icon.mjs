// 生成 1024×1024 应用图标源文件（PNG）：白底黑色魔法帽（哈利波特分院帽风格）。
// 宽帽檐 + 弯曲尖顶 + 圆润帽尖，简约黑白剪影。
// 使用 Node 内置 zlib 手动编码 PNG，无需依赖。
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SIZE = 1024;
const WHITE = [245, 245, 247]; // #F5F5F7 — Apple 灰白
const BLACK = [26, 26, 30]; // #1A1A1E — 略带蓝调的黑
const TRANSPARENT = [0, 0, 0, 0];

// 圆角半径
const CORNER_R = 228;

const cx = SIZE / 2; // 512

// —— 帽檐：宽扁椭圆 ——
const brimCY = 652;
const brimRX = 352;
const brimRY = 50;

// —— 帽身：弯曲圆锥，从帽檐中心向上收窄，尖端向左偏 ——
const bodyBaseY = 628;
const bodyTipY = 212;
const bodyBaseHalfW = 162;
const tipX = 406; // 尖端 x（向左弯曲）
const tipHalfW = 12; // 尖端不为零，配合圆形实现圆润帽尖

// —— 帽身褶皱线（白色细线，增加帽子质感）——
// 从帽身基部偏左到尖端附近，跟随弯曲方向
const creaseStart = { x: 476, y: 598 };
const creaseEnd = { x: 428, y: 262 };
const creaseWidth = 3;

// 判断点是否在圆角矩形内
function inRoundedRect(x, y, r) {
  if (x < 0 || x > SIZE || y < 0 || y > SIZE) return false;
  const corners = [
    { cx: r, cy: r },
    { cx: SIZE - r, cy: r },
    { cx: r, cy: SIZE - r },
    { cx: SIZE - r, cy: SIZE - r },
  ];
  for (const c of corners) {
    const inCornerBox =
      (c.cx === r ? x < r : x > SIZE - r) &&
      (c.cy === r ? y < r : y > SIZE - r);
    if (inCornerBox) {
      const dx = x - c.cx;
      const dy = y - c.cy;
      if (dx * dx + dy * dy > r * r) return false;
    }
  }
  return true;
}

// 帽檐：椭圆
function inBrim(x, y) {
  const dx = (x - cx) / brimRX;
  const dy = (y - brimCY) / brimRY;
  return dx * dx + dy * dy <= 1;
}

// 帽身：弯曲圆锥
function inBody(x, y) {
  if (y > bodyBaseY || y < bodyTipY) return false;
  const t = (bodyBaseY - y) / (bodyBaseY - bodyTipY); // 0=底部, 1=尖端
  // 中心线向左弯曲（加速弯曲）
  const centerX = cx + (tipX - cx) * Math.pow(t, 1.6);
  // 宽度收窄（凹形渐变）
  const halfW = bodyBaseHalfW * Math.pow(1 - t, 0.7) + tipHalfW;
  return Math.abs(x - centerX) <= halfW;
}

// 帽尖圆角：在尖端位置画一个小圆
function inTipCap(x, y) {
  const dx = x - tipX;
  const dy = y - bodyTipY;
  const r = tipHalfW + 3;
  return dx * dx + dy * dy <= r * r;
}

// 点到线段的距离
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// 褶皱线：帽身上的白色细线
function onCrease(x, y) {
  return distToSegment(x, y, creaseStart.x, creaseStart.y, creaseEnd.x, creaseEnd.y) <= creaseWidth;
}

// —— 渲染像素 ——
const rowLen = 1 + SIZE * 4; // RGBA
const raw = Buffer.alloc(rowLen * SIZE);

for (let y = 0; y < SIZE; y++) {
  raw[y * rowLen] = 0; // filter none
  for (let x = 0; x < SIZE; x++) {
    let color = TRANSPARENT;

    // 1. 白色圆角方底
    if (inRoundedRect(x, y, CORNER_R)) {
      color = [...WHITE, 255];
    }

    // 2. 黑色帽子剪影（帽檐 + 帽身 + 帽尖）
    const inHat =
      inBrim(x, y) || inBody(x, y) || inTipCap(x, y);
    if (inHat) {
      color = [...BLACK, 255];
    }

    // 3. 褶皱线：在帽子内部画白色细线
    if (inHat && onCrease(x, y)) {
      color = [...WHITE, 255];
    }

    const offset = y * rowLen + 1 + x * 4;
    raw[offset] = color[0];
    raw[offset + 1] = color[1];
    raw[offset + 2] = color[2];
    raw[offset + 3] = color[3];
  }
}

const compressed = deflateSync(raw, { level: 9 });

// CRC32 表
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync("app-icon.png", png);
console.log("wrote app-icon.png", png.length, "bytes");
