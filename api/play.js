import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonte
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Erro fonte:", e);
}

// Utils
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

function timeToSeconds(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Triângulos
function drawLeftTriangle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x + size, y - size / 2);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size, y + size / 2);
  ctx.closePath();
  ctx.fill();
}

function drawRightTriangle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size / 2);
  ctx.closePath();
  ctx.fill();
}

// =========================
// HANDLER
// =========================
export default async function handler(req, res) {
  try {
    const {
      channel = "Terence Howard",
      handle = "@terenceh",
      thumbnail = null,
      totalTime = "3:00"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1200;
    const H = 1200;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // -------------------------
    // Background
    // -------------------------
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    let img = null;
    if (thumbnail) {
      const response = await fetch(thumbnail);
      if (response.ok) {
        img = await loadImage(Buffer.from(await response.arrayBuffer()));
      }
    }

    if (img) {
      ctx.filter = 'blur(30px)';
      ctx.drawImage(img, -200, -200, W + 400, H + 400);
      ctx.filter = 'none';

      const scale = Math.max(W / img.width, H / img.height);
      ctx.drawImage(
        img,
        (W - img.width * scale) / 2,
        (H - img.height * scale) / 2 - 60,
        img.width * scale,
        img.height * scale
      );
    }

    // Gradiente inferior
    const bottomGrad = ctx.createLinearGradient(0, H - 500, 0, H);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 0, W, H);

    // -------------------------
    // Header
    // -------------------------
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
    ctx.fillText(truncateText(ctx, channel, 700), px + profileSize + 40, py + 40);

    ctx.fillStyle = '#b3b3b3';
    ctx.font = '48px Inter';
    ctx.fillText(handle, px + profileSize + 40, py + 95);

    // -------------------------
    // Barra de progresso
    // -------------------------
    const ratio = 0.4;
    const totalSec = timeToSeconds(totalTime);
    const current = formatTime(totalSec * ratio);
    const remaining = `-${formatTime(totalSec * (1 - ratio))}`;

    const barY = H - 320;
    const barX = 80;
    const barW = W - 160;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(barX, barY, barW, 6);

    ctx.fillStyle = '#fff';
    ctx.fillRect(barX, barY, barW * ratio, 6);

    ctx.font = '36px Inter';
    ctx.fillText(current, barX, barY + 40);
    ctx.textAlign = 'right';
    ctx.fillText(remaining, barX + barW, barY + 40);
    ctx.textAlign = 'left';

    // -------------------------
    // CONTROLES (estilo widget)
    // -------------------------
    const controlsY = H - 170;
    const playSize = 110;
    const sideSize = 50;
    const spacing = 180;
    const pairGap = 10;

    const offsets = {
      rewind: -70,
      forward: 0
    };

    function drawControlCircle(cx, cy, r, alpha = 0.06) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#fff';
    const centerX = W / 2;

    // Rewind
    const rewindCX = centerX - spacing + offsets.rewind;
    const r1 = rewindCX - (sideSize / 2 + pairGap / 2);
    const r2 = rewindCX + (sideSize / 2 + pairGap / 2);

    drawControlCircle(r1 + sideSize / 2, controlsY, sideSize + 22);
    drawControlCircle(r2 + sideSize / 2, controlsY, sideSize + 22);
    drawLeftTriangle(ctx, r1, controlsY, sideSize);
    drawLeftTriangle(ctx, r2, controlsY, sideSize);

    // Play
    drawControlCircle(centerX, controlsY, playSize + 32, 0.08);
    drawRightTriangle(ctx, centerX - playSize / 2, controlsY, playSize);

    // Forward
    const forwardCX = centerX + spacing + offsets.forward;
    const f1 = forwardCX - (sideSize / 2 + pairGap / 2);
    const f2 = forwardCX + (sideSize / 2 + pairGap / 2);

    drawControlCircle(f1 + sideSize / 2, controlsY, sideSize + 22);
    drawControlCircle(f2 + sideSize / 2, controlsY, sideSize + 22);
    drawRightTriangle(ctx, f1, controlsY, sideSize);
    drawRightTriangle(ctx, f2, controlsY, sideSize);

    // -------------------------
    // Output
    // -------------------------
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
