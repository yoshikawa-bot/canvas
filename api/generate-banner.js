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
  console.log("Erro fonte:", e);
}

// MUDANÇA 1: Cor do YouTube
const YOUTUBE_RED = "#FF0000";
const DARK_OVERLAY = "rgba(0, 0, 0, 0.85)";

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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
      totalTime = "3:00"
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
        console.log("Erro thumbnail:", e);
      }
    }

    // Fundo (Capa esticada com overlay escuro)
    if (thumbnailLoaded) {
      const scale = Math.max(W / img.width, H / img.height) * 1.4;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      
      ctx.drawImage(img, dx, dy, dw, dh);
      
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

    // Área da capa central
    if (thumbnailLoaded) {
      // MUDANÇA 3: Adicionado recorte (clip) para garantir que a imagem
      // seja cortada exatamente no formato quadrado, caso o original não seja.
      ctx.save(); // Salva o estado atual
      ctx.beginPath();
      ctx.rect(coverX, coverY, coverSize, coverSize); // Define a área quadrada
      ctx.clip(); // Aplica o recorte

      // Cálculo para preencher o quadrado (aspect fill/cover)
      const cscale = Math.max(coverSize / img.width, coverSize / img.height);
      const cw = img.width * cscale;
      const ch = img.height * cscale;
      // Centraliza a imagem redimensionada dentro da área de recorte
      const cx = coverX + (coverSize - cw) / 2;
      const cy = coverY + (coverSize - ch) / 2;
      
      ctx.drawImage(img, cx, cy, cw, ch);
      ctx.restore(); // Restaura o estado para remover o recorte para os próximos elementos
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(coverX, coverY, coverSize, coverSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 340px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', W / 2, coverY + coverSize / 2);
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    const leftMargin = 100;
    const maxTextWidth = W - leftMargin - 100;
    let textY = coverY + coverSize + 80;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncateText(ctx, title, maxTextWidth), leftMargin, textY);

    textY += 60;
    ctx.font = '500 48px Inter';
    ctx.fillStyle = '#b3b3b3';
    ctx.fillText(truncateText(ctx, channel, maxTextWidth), leftMargin, textY);

    // Lógica de tempo (mantida em 60%)
    const totalSec = timeToSeconds(totalTime);
    const ratio = 0.6; 
    const calculatedSec = totalSec * ratio;
    const displayCurrentTime = formatTime(calculatedSec);

    const progressBottom = H - 80;
    const barX = 100;
    const barWidth = W - 230;
    const barHeight = 10; 
    const barY = progressBottom - barHeight / 2;

    // Barra de fundo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Barra de progresso preenchida (Usando Vermelho YouTube)
    const filledWidth = barWidth * ratio;
    ctx.fillStyle = YOUTUBE_RED; // MUDANÇA 1 APLICADA
    ctx.beginPath();
    ctx.roundRect(barX, barY, filledWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Bolinha do progresso
    if (ratio > 0 && ratio < 1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(barX + filledWidth, barY + barHeight / 2, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Textos de tempo
    const timeY = progressBottom + 35;
    ctx.font = '400 30px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(displayCurrentTime || "0:00", barX, timeY);
    ctx.textAlign = 'right';
    ctx.fillText(totalTime || "0:00", barX + barWidth, timeY);

    // Logo no canto superior direito
    ctx.fillStyle = YOUTUBE_RED; // MUDANÇA 1 APLICADA
    ctx.font = 'bold 50px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    // MUDANÇA 2: Texto alterado para YouTube
    ctx.fillText('YouTube', W - 40, 40);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
}
