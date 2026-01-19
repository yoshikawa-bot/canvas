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

// --- FUNÇÃO PARA DESENHAR O ÍCONE DE AVIÃO ---
function drawPlaneCircle(ctx, x, y, radius) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Círculo escuro semi-transparente
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAirplane(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';
  const s = size;

  // Corpo/fuselagem
  ctx.fillRect(-s * 0.6, -s * 0.08, s * 1.3, s * 0.16);

  // Ponta (cockpit)
  ctx.beginPath();
  ctx.arc(s * 0.65, 0, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Asas principais
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, 0);
  ctx.lineTo(-s * 0.1, s * 0.35);
  ctx.lineTo(s * 0.25, s * 0.15);
  ctx.lineTo(s * 0.25, -s * 0.15);
  ctx.lineTo(-s * 0.1, -s * 0.35);
  ctx.closePath();
  ctx.fill();

  // Cauda
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, 0);
  ctx.lineTo(-s * 0.7, s * 0.25);
  ctx.lineTo(-s * 0.55, 0);
  ctx.lineTo(-s * 0.7, -s * 0.25);
  ctx.closePath();
  ctx.fill();

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
    const PADDING = 120;
    const CARD_RADIUS = 120;
    const BG_ZOOM = 1.4; // Ajuste para cobrir bem sem cortar muito

    const dayBgUrl = 'https://yoshikawa-bot.github.io/cache/images/ae96713a.jpg';
    const nightBgUrl = 'https://yoshikawa-bot.github.io/cache/images/232dfce8.jpg';

    const {
      dateStr = "8 de Maio de 2025",
      timeStr = "14:00",
      origin = "New York",
      destination = "Madrid",
      originLabel = "Origem",
      destinationLabel = "Destino",
      theme = "day" // "day" ou "night"
    } = req.method === "POST" ? req.body : req.query;

    const backgroundUrl = theme === "night" ? nightBgUrl : dayBgUrl;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- INÍCIO DA ÁREA DO "ADESIVO" ---
    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    let bgImg = null;

    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        const buf = Buffer.from(await response.arrayBuffer());
        bgImg = await loadImage(buf);
      }
    } catch (e) {}

    // BG Clipping (cantos arredondados)
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // Desenha o fundo
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
      // Fallback simples (céu claro)
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, '#87CEEB');
      fallback.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }

    // Sem overlay escuro forte → design limpo e simples, sem sombras/vidro

    // --- LINHA PONTILHADA CENTRAL ---
    const centerX = W / 2;
    const lineTop = 200;
    const lineBottom = H - 200;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 18]);
    ctx.beginPath();
    ctx.moveTo(centerX, lineTop);
    ctx.lineTo(centerX, lineBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- ÍCONE DO AVIÃO (círculo + avião) ---
    const planeY = H / 2;
    const planeRadius = 90;
    drawPlaneCircle(ctx, centerX, planeY, planeRadius);
    drawAirplane(ctx, centerX, planeY, planeRadius * 1.1);

    // --- TEXTOS SUPERIORES (data e hora) ---
    const topY = 140;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 62px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, PADDING, topY);

    ctx.textAlign = 'right';
    ctx.fillText(timeStr, W - PADDING, topY);

    // --- TEXTOS INFERIORES (origem e destino) ---
    const leftX = W * 0.28;
    const rightX = W * 0.72;
    const labelY = H - 300;
    const cityY = H - 190;

    // Labels
    ctx.fillStyle = '#DDDDDD';
    ctx.font = '400 50px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(originLabel, leftX, labelY);
    ctx.fillText(destinationLabel, rightX, labelY);

    // Cidades (com truncamento se muito longas)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 92px Inter, sans-serif';

    // Truncamento simples para origem
    let displayOrigin = origin;
    const maxCityWidth = 420;
    ctx.font = 'bold 92px Inter, sans-serif'; // Para medir corretamente
    if (ctx.measureText(displayOrigin).width > maxCityWidth) {
      while (ctx.measureText(displayOrigin + '...').width > maxCityWidth && displayOrigin.length > 0) {
        displayOrigin = displayOrigin.slice(0, -1);
      }
      displayOrigin += '...';
    }
    ctx.fillText(displayOrigin, leftX, cityY);

    // Mesmo para destino
    let displayDestination = destination;
    if (ctx.measureText(displayDestination).width > maxCityWidth) {
      while (ctx.measureText(displayDestination + '...').width > maxCityWidth && displayDestination.length > 0) {
        displayDestination = displayDestination.slice(0, -1);
      }
      displayDestination += '...';
    }
    ctx.fillText(displayDestination, rightX, cityY);

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
          }
