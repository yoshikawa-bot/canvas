import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================
// Fonte
// ==================
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log('Erro fonte:', e);
}

// ==================
// Utils
// ==================
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + '...').width > maxWidth && t.length > 1) {
    t = t.slice(0, -1);
  }
  return t + '...';
}

function timeToSeconds(t) {
  const p = t.split(':').map(Number);
  return p.length === 2 ? p[0] * 60 + p[1] : 0;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ==================
// Ícones ARREDONDADOS
// ==================
function drawRoundedPlay(ctx, cx, cy, size, r) {
  const w = size * 0.9;
  const h = size;

  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + r, cy - h / 2);
  ctx.lineTo(cx + w / 2 - r, cy);
  ctx.lineTo(cx - w / 2 + r, cy + h / 2);
  ctx.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy, r);
  ctx.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy, r);
  ctx.closePath();
  ctx.fill();
}

function drawRoundedBack(ctx, cx, cy, size, r) {
  const w = size * 0.9;
  const h = size;

  ctx.beginPath();
  ctx.moveTo(cx + w / 2 - r, cy - h / 2);
  ctx.lineTo(cx - w / 2 + r, cy);
  ctx.lineTo(cx + w / 2 - r, cy + h / 2);
  ctx.arcTo(cx + w / 2, cy + h / 2, cx + w / 2, cy, r);
  ctx.arcTo(cx + w / 2, cy - h / 2, cx - w / 2, cy, r);
  ctx.closePath();
  ctx.fill();
}

// ==================
// HANDLER
// ==================
export default async function handler(req, res) {
  try {
    const {
      channel = 'Terence Howard',
      handle = '@terenceh',
      thumbnail = null,
      totalTime = '3:00'
    } = req.method === 'POST' ? req.body : req.query;

    const W = 1200;
    const H = 1200;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ==================
    // Background
    // ==================
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    let img = null;
    if (thumbnail) {
      const r = await fetch(thumbnail);
      if (r.ok) img = await loadImage(Buffer.from(await r.arrayBuffer()));
    }

    if (img) {
      ctx.filter = 'blur(32px)';
      ctx.drawImage(img, -200, -200, W + 400, H + 400);
      ctx.filter = 'none';

      const s = Math.max(W / img.width, H / img.height);
      ctx.drawImage(
        img,
        (W - img.width * s) / 2,
        (H - img.height * s) / 2 - 60,
        img.width * s,
        img.height * s
      );
    }

    const grad = ctx.createLinearGradient(0, H - 500, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ==================
    // Header
    // ==================
    const profileSize = 130;
    const px = 80;
    const py = 80;

    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px + profileSize / 2, py + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, px, py, profileSize, profileSize);
      ctx.restore();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px Inter';
    ctx.fillText(truncateText(ctx, channel, 700), px + profileSize + 40, py + 45);

    ctx.fillStyle = '#b3b3b3';
    ctx.font = '48px Inter';
    ctx.fillText(handle, px + profileSize + 40, py + 95);

    // ==================
    // Barra de progresso
    // ==================
    const ratio = 0.4;
    const totalSec = timeToSeconds(totalTime);

    const barY = H - 320;
    const barX = 80;
    const barW = W - 160;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(barX, barY, barW, 6);

    ctx.fillStyle = '#fff';
    ctx.fillRect(barX, barY, barW * ratio, 6);

    ctx.font = '36px Inter';
    ctx.fillText(formatTime(totalSec * ratio), barX, barY + 40);
    ctx.textAlign = 'right';
    ctx.fillText(`-${formatTime(totalSec * (1 - ratio))}`, barX + barW, barY + 40);
    ctx.textAlign = 'left';

    // ==================
    // CONTROLES (final)
    // ==================
    const controlsY = H - 170;
    const iconSize = 60;
    const iconRadius = 26;
    const circleRadius = 72;
    const spacing = 180;

    const centerX = W / 2;

    function drawCircle(cx, cy) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#fff';

    // Back
    drawCircle(centerX - spacing, controlsY);
    drawRoundedBack(ctx, centerX - spacing, controlsY, iconSize, iconRadius);

    // Play
    drawCircle(centerX, controlsY);
    drawRoundedPlay(ctx, centerX, controlsY, iconSize, iconRadius);

    // Forward
    drawCircle(centerX + spacing, controlsY);
    drawRoundedPlay(ctx, centerX + spacing, controlsY, iconSize, iconRadius);

    // ==================
    // Output
    // ==================
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
            }
