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
} catch (e) {
  console.log("Não foi possível carregar a fonte Inter. Usando padrão.");
}

const GREEN = "#4ADE80";
const DARK_OVERLAY = "rgba(0, 0, 0, 0.65)";

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
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Título da música",
      channel = "Artista",
      thumbnail = null,
      currentTime = "0:00",
      totalTime = "3:56"
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
      } catch (e) {
        console.log("Erro ao carregar thumbnail:", e);
      }
    }

    // Fundo (blurred + escurecido)
    if (thumbnailLoaded) {
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      ctx.filter = 'blur(50px)';
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';

      ctx.fillStyle = DARK_OVERLAY;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);
    }

    // Capa central sharp
    const coverSize = 600;
    const coverX = (W - coverSize) / 2;
    const coverY = 150;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(coverX, coverY, coverSize, coverSize, 40);
    ctx.clip();

    if (thumbnailLoaded) {
      const cscale = Math.max(coverSize / img.width, coverSize / img.height);
      const cw = img.width * cscale;
      const ch = img.height * cscale;
      const cx = coverX + (coverSize - cw) / 2;
      const cy = coverY + (coverSize - ch) / 2;
      ctx.drawImage(img, cx, cy, cw, ch);
    } else {
      // Placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(coverX, coverY, coverSize, coverSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 300px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', W / 2, coverY + coverSize / 2);
    }
    ctx.restore();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Título e artista
    let titleY = coverY + coverSize + 70;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncateText(ctx, title, W - 200), W / 2, titleY);

    let artistY = titleY + 100;
    ctx.font = '500 55px Inter';
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText(truncateText(ctx, channel, W - 200), W / 2, artistY);

    // Cálculo do progresso
    const currentSec = timeToSeconds(currentTime);
    const totalSec = timeToSeconds(totalTime);
    const ratio = totalSec > 0 ? currentSec / totalSec : 0;

    // Barra de progresso
    const progressY = artistY + 130;
    const barX = (W - 800) / 2;
    const barWidth = 800;
    const barHeight = 8;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barWidth, barHeight, barHeight);
    ctx.fill();

    ctx.fillStyle = GREEN;
    const filledWidth = barWidth * ratio;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, filledWidth, barHeight, barHeight);
    ctx.fill();

    // Indicador
    if (ratio > 0 && ratio < 1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(barX + filledWidth, progressY + barHeight / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tempos
    ctx.font = '400 40px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX - 20, progressY + barHeight / 2);
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barWidth + 20, progressY + barHeight / 2);

    // Controles
    const controlsY = progressY + 130;
    const bigRadius = 80;
    const skipDistance = 220;

    // Botão grande play/pause
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(W / 2, controlsY, bigRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    if (ratio > 0.02 && ratio < 0.98) {
      // Pause (tocando)
      const barW = 14;
      const barH = 60;
      const space = 24;
      ctx.fillRect(W / 2 - space - barW, controlsY - barH / 2, barW, barH);
      ctx.fillRect(W / 2 + space, controlsY - barH / 2, barW, barH);
    } else {
      // Play
      const triSize = 50;
      ctx.beginPath();
      ctx.moveTo(W / 2 + 12, controlsY - triSize);
      ctx.lineTo(W / 2 + 12, controlsY + triSize);
      ctx.lineTo(W / 2 + 12 + triSize * 1.2, controlsY);
      ctx.closePath();
      ctx.fill();
    }

    // Prev e Next
    ctx.fillStyle = '#FFFFFF';
    const iconSize = 45;

    // Prev (<<)
    const prevX = W / 2 - skipDistance;
    ctx.beginPath();
    ctx.moveTo(prevX + 15, controlsY - iconSize);
    ctx.lineTo(prevX + 15, controlsY + iconSize);
    ctx.lineTo(prevX + 15 - iconSize, controlsY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(prevX - 15, controlsY - iconSize);
    ctx.lineTo(prevX - 15, controlsY + iconSize);
    ctx.lineTo(prevX - 15 - iconSize, controlsY);
    ctx.closePath();
    ctx.fill();

    // Next (>>)
    const nextX = W / 2 + skipDistance;
    ctx.beginPath();
    ctx.moveTo(nextX - 15, controlsY - iconSize);
    ctx.lineTo(nextX - 15, controlsY + iconSize);
    ctx.lineTo(nextX - 15 + iconSize, controlsY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(nextX + 15, controlsY - iconSize);
    ctx.lineTo(nextX + 15, controlsY + iconSize);
    ctx.lineTo(nextX + 15 + iconSize, controlsY);
    ctx.closePath();
    ctx.fill();

    // Logo Spotify (texto)
    ctx.fillStyle = GREEN;
    ctx.font = 'bold 70px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('Spotify', W - 70, 70);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro geral:", e);
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
  }
