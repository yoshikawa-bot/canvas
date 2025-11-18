import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registrar fonte Inter
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log('Fonte Inter não carregada, usando fonte padrão');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = 'Título da Música',
      channel = 'Canal',
      thumbnail = null,
      currentTime = '1:30',
      totalTime = '3:00'
    } = req.method === 'POST' ? req.body : req.query;

    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Fundo Apple (cinza claro)
    ctx.fillStyle = '#F5F5F7';
    ctx.fillRect(0, 0, W, H);

    // Card central
    const cardW = 900;
    const cardH = 500;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
    ctx.fill();

    // --- CAPA / THUMBNAIL ---
    const coverSize = 300;
    const coverX = cardX + 60;
    const coverY = cardY + 100;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buffer);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
          ctx.restore();

          thumbnailLoaded = true;
        }
      } catch {}
    }

    // Fallback real
    if (!thumbnailLoaded) {
      ctx.fillStyle = '#E5E5EA';
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
      ctx.fill();

      ctx.fillStyle = '#A1A1A6';
      ctx.font = 'bold 120px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎵', coverX + coverSize / 2, coverY + coverSize / 2 + 15);
    }

    // --- TEXTO ---
    const textX = coverX + coverSize + 60;
    let textY = coverY + 40;

    // Título (maior, Apple style)
    ctx.fillStyle = '#111';
    ctx.font = '800 50px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(truncateText(ctx, title, 420), textX, textY);

    // Canal (cinza leve)
    textY += 55;
    ctx.font = '400 28px Inter';
    ctx.fillStyle = '#6C6C6C';
    ctx.fillText(channel, textX, textY);

    // --- BARRA DE PROGRESSO ---
    const progressY = textY + 90;
    const barW = 420;
    const barH = 8;

    // Base
    ctx.fillStyle = '#D2D2D7';
    ctx.beginPath();
    ctx.roundRect(textX, progressY, barW, barH, 4);
    ctx.fill();

    // Progresso
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    const ratio = total > 0 ? Math.min(current / total, 1) : 0;

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(textX, progressY, barW * ratio, barH, 4);
    ctx.fill();

    // Tempos
    ctx.font = '500 20px Inter';
    ctx.fillStyle = '#6C6C6C';

    ctx.textAlign = 'left';
    ctx.fillText(currentTime, textX, progressY + 35);

    ctx.textAlign = 'right';
    ctx.fillText(totalTime, textX + barW, progressY + 35);

    // Rodapé discreto
    ctx.font = '400 20px Inter';
    ctx.fillStyle = '#A1A1A6';
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Music Player', W/2, H - 40);

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao gerar banner', message: e.message });
  }
}

// FUNÇÕES AUXILIARES
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function timeToSeconds(t) {
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}
