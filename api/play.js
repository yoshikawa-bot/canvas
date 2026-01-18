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
  if (p.length === 3) return p[0] * 3600 + p[[1]] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

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

    const radius = 100;

    // Sombra externa do card
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, radius);
    ctx.fill();

    // Reset sombra e clip para conteúdo
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, radius);
    ctx.clip();

    // Imagem de fundo desfocada + imagem principal nítida
    if (thumbnailLoaded) {
      // Desfocado
      ctx.filter = 'blur(30px)';
      let scale = Math.max(W / img.width, H / img.height) * 1.5;
      let dw = img.width * scale;
      let dh = img.height * scale;
      let dx = (W - dw) / 2;
      let dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

      // Nítida (leve zoom e ligeiramente para cima para cabeça mais alta)
      ctx.filter = 'none';
      scale = Math.max(W / img.width, H / img.height) * 1.05;
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (W - dw) / 2;
      dy = (H - dh) / 2 - 50;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 200px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', W / 2, H / 2);
    }

    // Vignette + gradiente inferior mais escuro
    let radial = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.8);
    radial.addColorStop(0, 'rgba(0,0,0,0)');
    radial.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    let bottomGrad = ctx.createLinearGradient(0, H - 500, 0, H);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 0, W, H);

    // Foto de perfil circular
    const profileSize = 140;
    const profileRadius = profileSize / 2;
    const profileX = 60 + profileRadius;
    const profileY = 60 + profileRadius;

    if (thumbnailLoaded) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(profileX, profileY, profileRadius, 0, Math.PI * 2);
      ctx.clip();
      const pscale = Math.max(profileSize / img.width, profileSize / img.height) * 1.5;
      const pw = img.width * pscale;
      const ph = img.height * pscale;
      const px = profileX - pw / 2;
      const py = profileY - ph / 2;
      ctx.drawImage(img, px, py, pw, ph);
      ctx.restore();

      // Borda sutil
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(profileX, profileY, profileRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Nome e handle
    const textX = profileX + profileRadius + 40;
    const textY = profileY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px Inter';
    ctx.fillText(truncateText(ctx, channel, W - textX - 250), textX, textY - 40);

    ctx.fillStyle = '#b3b3b3';
    ctx.font = '500 50px Inter';
    ctx.fillText(truncateText(ctx, handle, W - textX - 250), textX, textY + 40);

    // Ícones dislike e like (emoji – troque por path se não renderizar)
    const iconY = profileY;
    ctx.font = '70px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('👎', W - 140, iconY);
    ctx.fillText('❤️', W - 70, iconY);

    // Progresso
    const ratio = 0.4; // ~0:52 de ~2:13 como na imagem
    const totalSec = timeToSeconds(totalTime);
    const currentSec = Math.floor(totalSec * ratio);
    const remainingSec = totalSec - currentSec;
    const displayCurrent = formatTime(currentSec);
    const displayRemaining = remainingSec > 0 ? `-${formatTime(remainingSec)}` : '0:00';

    const barX = 80;
    const barWidth = W - 160;
    const barHeight = 8;
    const barY = H - 300;

    const filledWidth = barWidth * ratio;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Barra preenchida
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(barX, barY, filledWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Knob
    if (ratio > 0 && ratio < 1) {
      const knobX = barX + filledWidth;
      const knobY = barY + barHeight / 2;
      const knobRadius = 16;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Tempos
    const timeY = barY + barHeight + 50;
    ctx.font = '400 40px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(displayCurrent, barX, timeY);
    ctx.textAlign = 'right';
    ctx.fillText(displayRemaining, barX + barWidth, timeY);

 // Controles
const controlsY = H - 120;
const playSize = 90;
const sideSize = 50;
const spacing = 120;
const pairGap = 10; // espaço entre os dois triângulos pequenos

ctx.fillStyle = '#FFFFFF';

// Centro da tela
const centerX = W / 2;

// =====================
// Rewind (esquerda)
// =====================
const rewindCenterX = centerX - spacing;

// triângulo da esquerda
drawLeftTriangle(
  ctx,
  rewindCenterX - (sideSize / 2 + pairGap / 2),
  controlsY,
  sideSize
);

// triângulo da direita
drawLeftTriangle(
  ctx,
  rewindCenterX + (sideSize / 2 + pairGap / 2),
  controlsY,
  sideSize
);

// =====================
// Play (centro)
// =====================
drawRightTriangle(
  ctx,
  centerX - playSize / 2,
  controlsY,
  playSize
);

// =====================
// Forward (direita)
// =====================
const forwardCenterX = centerX + spacing;

// triângulo da esquerda
drawRightTriangle(
  ctx,
  forwardCenterX - (sideSize / 2 + pairGap / 2),
  controlsY,
  sideSize
);

// triângulo da direita
drawRightTriangle(
  ctx,
  forwardCenterX + (sideSize / 2 + pairGap / 2),
  controlsY,
  sideSize
);

ctx.restore(); // fim do clip

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
    }
