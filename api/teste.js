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

const GREEN = "#4ADE80";
const DARK_OVERLAY = "rgba(0, 0, 0, 0.75)";

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Título",
      channel = "Artista",
      thumbnail = null,
      currentTime = "0:00",
      totalTime = "0:00"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1200;
    const H = 1200;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    let img = null;
    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          img = await loadImage(buf);
          thumbnailLoaded = true;
        }
      } catch (e) {}
    }

    if (thumbnailLoaded) {
      const scale = Math.max(W / img.width, H / img.height) * 1.4;
      ctx.filter = 'blur(70px)';
      ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.filter = 'none';
      ctx.fillStyle = DARK_OVERLAY;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, W, H);
    }

    const coverSize = 780;
    const coverX = (W - coverSize) / 2;
    const coverY = 120;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;

    if (thumbnailLoaded) {
      const cscale = Math.max(coverSize / img.width, coverSize / img.height);
      ctx.drawImage(img, coverX + (coverSize - img.width * cscale) / 2, coverY + (coverSize - img.height * cscale) / 2, img.width * cscale, img.height * cscale);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(coverX, coverY, coverSize, coverSize);
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    const leftMargin = 100;
    const maxTextWidth = W - leftMargin - 100;
    let textY = coverY + coverSize + 80;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(truncateText(ctx, title, maxTextWidth), leftMargin, textY);

    textY += 60;
    ctx.font = '500 48px Inter';
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText(truncateText(ctx, channel, maxTextWidth), leftMargin, textY);

    const ratio = 0.6;
    const progressBottom = H - 60;
    const barX = 100;
    const barWidth = W - 230;
    const barHeight = 10;
    const barY = progressBottom - barHeight / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, barHeight / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(barX + (barWidth * ratio), barY + barHeight / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    const timeY = progressBottom + 30;
    ctx.font = '400 26px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX, timeY);
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barWidth, timeY);

    ctx.fillStyle = GREEN;
    ctx.font = 'bold 50px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Spotify', W - 40, 40);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (e) {
    res.status(500).send("Erro");
  }
}
