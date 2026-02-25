'use strict';

const axios  = require('axios');
const { createCanvas } = require('canvas');
const fs     = require('fs');
const path   = require('path');

const PACKAGE  = 'newchat.js';
const OUT_FILE = path.join(__dirname, '..', 'assets', 'npm-downloads.png');

// Chart config
const W = 800, H = 350;
const PAD = { top: 40, right: 30, bottom: 60, left: 70 };
const ACCENT  = '#e51137';
const BG      = '#0d1117';   // GitHub dark bg
const GRID    = '#21262d';
const TEXT    = '#c9d1d9';
const SUBTEXT = '#6e7681';

async function fetchDownloads() {
  const url = `https://api.npmjs.org/downloads/range/last-month/${PACKAGE}`;
  const { data } = await axios.get(url);
  return data.downloads; // [{ day: "YYYY-MM-DD", downloads: N }, ...]
}

function drawChart(downloads) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.roundRect(0, 0, W, H, 12);
  ctx.fill();

  const days   = downloads.map(d => d.day);
  const counts = downloads.map(d => d.downloads);
  const maxVal = Math.max(...counts) || 1;
  const total  = counts.reduce((a, b) => a + b, 0);

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  // Grid lines + Y labels
  const gridLines = 5;
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  for (let i = 0; i <= gridLines; i++) {
    const y = PAD.top + chartH - (i / gridLines) * chartH;
    const v = Math.round((i / gridLines) * maxVal);

    ctx.strokeStyle = GRID;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = SUBTEXT;
    ctx.fillText(v.toLocaleString(), PAD.left - 8, y + 4);
  }

  // X labels (every 7 days)
  ctx.textAlign = 'center';
  ctx.fillStyle = SUBTEXT;
  ctx.font = '11px sans-serif';
  days.forEach((day, i) => {
    if (i % 7 !== 0) return;
    const x = PAD.left + (i / (days.length - 1)) * chartW;
    ctx.fillText(day.slice(5), x, H - PAD.bottom + 18);
  });

  // Gradient fill under line
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
  grad.addColorStop(0,   'rgba(229,17,55,0.35)');
  grad.addColorStop(1,   'rgba(229,17,55,0.02)');

  ctx.beginPath();
  counts.forEach((v, i) => {
    const x = PAD.left + (i / (counts.length - 1)) * chartW;
    const y = PAD.top  + chartH - (v / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  // Close path for fill
  ctx.lineTo(PAD.left + chartW, PAD.top + chartH);
  ctx.lineTo(PAD.left,          PAD.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  counts.forEach((v, i) => {
    const x = PAD.left + (i / (counts.length - 1)) * chartW;
    const y = PAD.top  + chartH - (v / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Title
  ctx.textAlign = 'left';
  ctx.font      = 'bold 15px sans-serif';
  ctx.fillStyle = TEXT;
  ctx.fillText(`${PACKAGE} — Downloads last 30 days`, PAD.left, 26);

  // Total badge (top-right)
  const label = `Total: ${total.toLocaleString()}`;
  ctx.font      = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = ACCENT;
  ctx.fillText(label, W - PAD.right, 26);

  return canvas.toBuffer('image/png');
}

(async () => {
  try {
    console.log(`Fetching downloads for ${PACKAGE}...`);
    const downloads = await fetchDownloads();
    console.log(`Got ${downloads.length} days of data.`);

    const png = drawChart(downloads);
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, png);
    console.log(`Chart saved → ${OUT_FILE}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
