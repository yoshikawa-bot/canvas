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
const DARK_OVERLAY = "rgba(0, 0, 0, 0.70)";

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
      albumType = "", // novo parâmetro opcional (ex: "Single", "Álbum", etc.)
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

    // Fundo: imagem borrada forte + overlay escuro
    if (thumbnailLoaded) {
      const scale = Math.max(W / img.width, H / img.height) * 1.3; // zoom leve para melhor blur
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      ctx.filter = 'blur(60px)';
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';

      ctx.fillStyle = DARK_OVERLAY;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, W, H);
    }

    // Capa central sharp (maior, com cantos arredondados sutis)
    const coverSize = 740;
    const coverX = (W - coverSize) / 2;
    const coverY = 140;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(coverX, coverY, coverSize, coverSize, 24);
    ctx.clip();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 30;

    if (thumbnailLoaded) {
      const cscale = Math.max(coverSize / img.width, coverSize / img.height);
      const cw = img.width * cscale;
      const ch = img.height * cscale;
      const cx = coverX + (coverSize - cw) / 2;
      const cy = coverY + (coverSize - ch) / 2;
      ctx.drawImage(img, cx, cy, cw, ch);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(coverX, coverY, coverSize, coverSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 320px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', W / 2, coverY + coverSize / 2);
    }
    ctx.restore();

    ctx.shadowBlur = 0;

    // Textos centralizados abaixo da capa
    let textY = coverY + coverSize + 80;

    // Título
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 92px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncateText(ctx, title, W - 160), W / 2, textY);

    textY += 120;

    // Artista(s)
    ctx.font = '500 56px Inter';
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText(truncateText(ctx, channel, W - 160), W / 2, textY);

    // Album type (Single, Álbum, etc.) – opcional
    if (albumType) {
      textY += 80;
      ctx.font = '400 48px Inter';
      ctx.fillStyle = '#909090';
      ctx.fillText(albumType, W / 2, textY);
    }

    // Cálculo do progresso
    const currentSec = timeToSeconds(currentTime);
    const totalSec = timeToSeconds(totalTime);
    const ratio = totalSec > 0 ? Math.max(0, Math.min(1, currentSec / totalSec)) : 0;

    // Barra de progresso (bem na parte inferior)
    const progressBottom = H - 120;
    const barX = 100;
    const barWidth = W - 200;
    const barHeight = 6;
    const barY = progressBottom - barHeight / 2;

    // Barra base (cinza escura)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Barra preenchida (verde)
    const filledWidth = barWidth * ratio;
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.roundRect(barX, barY, filledWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Indicador pequeno branco no final da barra preenchida
    if (ratio > 0 && ratio < 1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(barX + filledWidth, barY + barHeight / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tempos (abaixo da barra)
    const timeY = progressBottom + 50;
    ctx.font = '400 42px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText(currentTime || "0:00", barX, timeY);

    ctx.textAlign = 'right';
    ctx.fillText(totalTime || "0:00", barX + barWidth, timeY);

    // Logo Spotify (topo direito, pequeno)
    ctx.fillStyle = GREEN;
    ctx.font = 'bold 56px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('Spotify', W - 80, 80);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro geral:", e);
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
}
