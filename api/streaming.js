import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const q = req.method === 'POST' ? req.body : req.query;

    const posterUrl = q?.poster  || '';
    const title     = q?.title   || '';
    const year      = q?.year    || '';
    const genres    = q?.genres  || '';
    const meta      = q?.meta    || '';
    const tipo      = q?.tipo    || 'movie';

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE     = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin            = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES        = 1080;
    const scaleFactor       = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES, H = DESIGN_RES, CARD_RADIUS = 140;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx    = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, W, H);

    let posterImg = null;
    if (posterUrl) {
      try {
        const resp = await fetch(posterUrl);
        if (resp.ok) {
          posterImg = await loadImage(Buffer.from(await resp.arrayBuffer()));
        }
      } catch {}
    }

    const PAD    = 64;
    const INFO_Y = H - 320;

    if (posterImg) {
      const scale = Math.max(W / posterImg.width, H / posterImg.height);
      const pw    = posterImg.width  * scale;
      const ph    = posterImg.height * scale;
      const px    = (W - pw) / 2;
      const py    = (H - ph) / 2;
      ctx.drawImage(posterImg, px, py, pw, ph);
    }

    const grad = ctx.createLinearGradient(0, INFO_Y - 280, 0, H);
    grad.addColorStop(0,    'rgba(0,0,0,0)');
    grad.addColorStop(0.25, 'rgba(0,0,0,0.45)');
    grad.addColorStop(0.6,  'rgba(0,0,0,0.72)');
    grad.addColorStop(1,    'rgba(0,0,0,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const badge = tipo === 'movie' ? 'FILME' : tipo === 'tv' ? 'SÉRIE' : 'ANIME';
    ctx.font = 'bold 24px Inter, sans-serif';
    const badgeW = ctx.measureText(badge).width + 56;
    const badgeH = 40;
    const badgeX = PAD;
    const badgeY = INFO_Y - 60;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.clip();
    if (posterImg) {
      const scale = Math.max(W / posterImg.width, H / posterImg.height);
      const pw    = posterImg.width  * scale;
      const ph    = posterImg.height * scale;
      ctx.filter = 'blur(20px)';
      ctx.drawImage(posterImg, (W - pw) / 2, (H - ph) / 2, pw, ph);
      ctx.filter = 'none';
    }
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.stroke();

    ctx.fillStyle    = 'rgba(255,255,255,0.90)';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, badgeX + 28, badgeY + badgeH / 2);

    let titleFontSize = 72;
    ctx.font = `bold ${titleFontSize}px Inter, sans-serif`;
    while (ctx.measureText(title).width > W - PAD * 2 && titleFontSize > 36) {
      titleFontSize -= 2;
      ctx.font = `bold ${titleFontSize}px Inter, sans-serif`;
    }

    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    const titleLines = wrapText(ctx, title, W - PAD * 2);
    const lineH      = titleFontSize * 1.15;
    titleLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, PAD, INFO_Y + i * lineH);
    });
    const afterTitle = INFO_Y + Math.min(titleLines.length, 2) * lineH + 16;

    if (year || meta) {
      ctx.font         = '500 34px Inter, sans-serif';
      ctx.fillStyle    = 'rgba(255,255,255,0.65)';
      ctx.textBaseline = 'top';
      const yearMeta = [year, meta].filter(Boolean).join('  •  ');
      ctx.fillText(yearMeta, PAD, afterTitle);
    }

    const afterMeta = afterTitle + 52;
    if (genres) {
      ctx.font         = '500 30px Inter, sans-serif';
      ctx.fillStyle    = 'rgba(255,255,255,0.45)';
      ctx.textBaseline = 'top';
      const genreLines = wrapText(ctx, genres, W - PAD * 2);
      genreLines.slice(0, 1).forEach((line, i) => {
        ctx.fillText(line, PAD, afterMeta + i * 40);
      });
    }

    ctx.font         = 'bold 26px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.55)';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOSHIKAWA SYSTEMS', PAD, H - 44);

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send('Erro na geração');
  }
}
