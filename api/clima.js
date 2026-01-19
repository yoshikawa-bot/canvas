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
} catch (e) { }

// --- FUNÇÕES DE DESENHO VETORIAL (ÍCONES PARA CLIMA) ---

function drawHumidityIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.5, s * 0.3, -s * 0.7, -s * 0.2, -s * 0.4, -s * 0.6);
  ctx.bezierCurveTo(0, -s, s * 0.4, -s * 0.6, s * 0.7, -s * 0.2);
  ctx.bezierCurveTo(s * 0.5, s * 0.3, 0, s * 0.3, 0, s * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawWindIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = 'round';
  const len = size * 1.1;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(-len * 0.4, 0);
  ctx.moveTo(-len * 0.4, 0);
  ctx.quadraticCurveTo(0, -len * 0.6, len * 0.4, 0);
  ctx.moveTo(len * 0.4, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

// Função genérica para efeito de vidro em Retângulos Arredondados
function drawGlassRect(ctx, x, y, w, h, radius, bgImg, bgRect) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(20px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// --- HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONSTANTES DE AJUSTE "ADESIVO" ---
    const DESIGN_RES = 1080; 
    const FINAL_CANVAS_SIZE = 1080; 
    const STICKER_SCALE = 0.92; 

    // --- CÁLCULOS DE POSICIONAMENTO ---
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    // --- MEDIDAS DE UI ---
    const W = DESIGN_RES, H = DESIGN_RES;
    const PADDING = 90, CARD_RADIUS = 120;
    const BG_ZOOM = 1.9;

    const {
      location = "São Paulo, SP",
      currentTemp = "26°C",
      condition = "Parcialmente nublado",
      high = "29°C",
      low = "21°C",
      humidity = "78%",
      wind = "18 km/h",
      backgroundUrl = "https://images.unsplash.com/photo-1545134969-8debd7252177?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80",
      iconUrl = "https://openweathermap.org/img/wn/03d@4x.png"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- INÍCIO DA ÁREA DO "ADESIVO" ---
    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    let bgImg = null;
    let iconImg = null;

    try {
      if (backgroundUrl) {
        const response = await fetch(backgroundUrl);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          bgImg = await loadImage(buf);
        }
      }
    } catch (e) {}

    try {
      if (iconUrl) {
        const response = await fetch(iconUrl);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          iconImg = await loadImage(buf);
        }
      }
    } catch (e) {}

    // BG Clipping
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    let bgRect = { x: 0, y: 0, w: W, h: H };
    if (bgImg) {
      const scale = Math.max(W / bgImg.width, H / bgImg.height) * BG_ZOOM;
      bgRect = {
        w: bgImg.width * scale,
        h: bgImg.height * scale,
        x: (W - bgRect.w) / 2,
        y: (H - bgRect.h) / 2
      };
      ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    } else {
      // Fallback gradiente céu claro
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, '#87CEEB');
      fallback.addColorStop(1, '#E0F7FA');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }

    // Overlay escuro (mais forte na parte inferior)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // --- HEADER (PÍLULA DE VIDRO SUPERIOR) ---
    const headerH = 200;
    const pillX = PADDING;
    const pillY = PADDING;
    const pillWidth = W - PADDING * 2;

    drawGlassRect(ctx, pillX, pillY, pillWidth, headerH, headerH / 2, bgImg, bgRect);

    // Ícone do clima (esquerda, circular)
    const iconSize = 140;
    const iconCenterX = pillX + 60;
    const iconCenterY = pillY + headerH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, iconSize / 2, 0, Math.PI * 2);
    ctx.clip();
    if (iconImg) {
      ctx.drawImage(iconImg, iconCenterX - iconSize / 2, iconCenterY - iconSize / 2, iconSize, iconSize);
    }
    ctx.restore();

    // Textos (localização e condição)
    const textStartX = iconCenterX + iconSize / 2 + 40;
    const centerY = pillY + headerH / 2;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 55px Inter, sans-serif';

    let displayLocation = location;
    const maxLocationWidth = (pillWidth / 2) - 100;
    if (ctx.measureText(displayLocation).width > maxLocationWidth) {
      while (ctx.measureText(displayLocation + '...').width > maxLocationWidth && displayLocation.length > 0) {
        displayLocation = displayLocation.slice(0, -1);
      }
      displayLocation += '...';
    }
    ctx.fillText(displayLocation, textStartX, centerY - 25);

    ctx.font = '400 40px Inter, sans-serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(condition, textStartX, centerY + 35);

    // Temperatura atual (direita, grande)
    ctx.textAlign = 'right';
    ctx.font = 'bold 110px Inter, sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(currentTemp, W - PADDING, centerY + 15);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(currentTemp, W - PADDING, centerY + 15);

    // --- MÁXIMA / MÍNIMA (central, abaixo da pílula) ---
    const hlY = pillY + headerH + 120;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '400 45px Inter, sans-serif';
    ctx.fillText('Máxima', W / 2 - 130, hlY);
    ctx.fillText('Mínima', W / 2 + 130, hlY);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.fillText(high, W / 2 - 130, hlY + 70);
    ctx.fillText(low, W / 2 + 130, hlY + 70);

    // --- DETALHES INFERIORES (pílula de vidro com umidade e vento) ---
    const detailsY = H - 280;
    const detailsH = 180;
    const detailsRadius = 90;
    drawGlassRect(ctx, PADDING, detailsY, W - PADDING * 2, detailsH, detailsRadius, bgImg, bgRect);

    const leftCX = W / 2 - 180;
    const rightCX = W / 2 + 180;
    const detailsCenterY = detailsY + detailsH / 2;

    // Ícones
    drawHumidityIcon(ctx, leftCX, detailsCenterY - 45, 70);
    drawWindIcon(ctx, rightCX, detailsCenterY - 45, 70);

    // Valores
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(humidity, leftCX, detailsCenterY + 20);
    ctx.fillText(wind, rightCX, detailsCenterY + 20);

    // Labels
    ctx.font = '400 36px Inter, sans-serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('Umidade', leftCX, detailsCenterY + 70);
    ctx.fillText('Vento', rightCX, detailsCenterY + 70);

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
}
