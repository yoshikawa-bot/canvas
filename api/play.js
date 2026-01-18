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

// --- FUNÇÕES DE DESENHO VETORIAL (ÍCONES) ---

function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const s = size * 0.8; // Escala interna
  const topCurveHeight = s * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, 0, -s / 2, 0, -s / 2, topCurveHeight);
  ctx.bezierCurveTo(-s / 2, s / 2, 0, s * 0.8, 0, s);
  ctx.bezierCurveTo(0, s * 0.8, s / 2, s / 2, s / 2, topCurveHeight);
  ctx.bezierCurveTo(s / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.fill();
  ctx.restore();
}

function drawShareIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const s = size * 0.7;
  // Base quadrada aberta
  ctx.beginPath();
  ctx.moveTo(-s/2, -s/4);
  ctx.lineTo(-s/2, s/2);
  ctx.lineTo(s/2, s/2);
  ctx.lineTo(s/2, -s/4);
  ctx.stroke();

  // Seta central
  ctx.beginPath();
  ctx.moveTo(0, s/2);
  ctx.lineTo(0, -s/2);
  ctx.stroke();

  // Cabeça da seta
  ctx.beginPath();
  ctx.moveTo(-s/3, -s/5);
  ctx.lineTo(0, -s/2);
  ctx.lineTo(s/3, -s/5);
  ctx.stroke();
  ctx.restore();
}

function drawGlassCircle(ctx, centerX, centerY, radius, bgImg, bgRect) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(25px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();
  ctx.restore();
}

function drawPlayIcon(ctx, x, y, size) {
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const visualOffset = size / 8;
  ctx.moveTo(x - size / 2 + visualOffset, y - size / 2);
  ctx.lineTo(x + size / 2 + visualOffset, y);
  ctx.lineTo(x - size / 2 + visualOffset, y + size / 2);
  ctx.fill();
}

function drawSkipIcon(ctx, x, y, size, direction) {
  ctx.fillStyle = '#FFFFFF';
  const barWidth = size * 0.15;
  const triangleSize = size * 0.5;
  ctx.save();
  ctx.translate(x, y);
  if (direction === -1) ctx.scale(-1, 1);
  ctx.fillRect((size/2) - barWidth, -size/2, barWidth, size);
  const t1X = (size/2) - barWidth - 2; 
  ctx.beginPath();
  ctx.moveTo(t1X, 0); 
  ctx.lineTo(t1X - triangleSize, -size/2);
  ctx.lineTo(t1X - triangleSize, size/2);
  ctx.fill();
  const t2X = t1X - triangleSize + 5;
  ctx.beginPath();
  ctx.moveTo(t2X, 0);
  ctx.lineTo(t2X - triangleSize, -size/2);
  ctx.lineTo(t2X - triangleSize, size/2);
  ctx.fill();
  ctx.restore();
}

// --- HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- MEDIDAS DE UI ---
    const W = 1080, H = 1080, PADDING = 90, CARD_RADIUS = 120;
    const CONTROLS_Y_BOTTOM = 140, CONTROLS_GAP = 260;
    const PLAY_BTN_RADIUS = 110, SIDE_BTN_RADIUS = 80;
    const PLAY_ICON_SIZE = 70, SIDE_ICON_SIZE = 40;
    const PROGRESS_Y_BOTTOM = 360, TIME_SIZE = 48;
    const BG_ZOOM = 1.9;

    const {
      channel = "Terence Howard",
      handle = "@terenceh",
      thumbnail = "https://i.scdn.co/image/ab67616d0000b273b5f0709d2243e8cb9e623d61",
      totalTime = "2:13"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    let img = null;
    try {
        if(thumbnail && thumbnail.startsWith('http')) {
             const response = await fetch(thumbnail);
             const buf = Buffer.from(await response.arrayBuffer());
             img = await loadImage(buf);
        }
    } catch (e) { }

    // BG Clipping
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    let bgRect = { x: 0, y: 0, w: W, h: H };
    if (img) {
        const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM;
        bgRect.w = img.width * scale;
        bgRect.h = img.height * scale;
        bgRect.x = (W - bgRect.w) / 2;
        bgRect.y = (H - bgRect.h) / 2;
        ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // --- HEADER ---
    const headerH = 150;
    const pillX = PADDING, pillY = PADDING;
    const pillWidth = W - PADDING*2 - headerH*2.2 - 20;

    // Fundo Perfil (Cápsula)
    drawGlassCircle(ctx, pillX + headerH/2, pillY + headerH/2, headerH/2, img, bgRect); // Mock para blur no pill
    ctx.fillStyle = 'rgba(40, 40, 40, 0.6)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, headerH, headerH/2);
    ctx.fill();
    
    // Avatar circular
    const avSize = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pillX + 20 + avSize/2, pillY + headerH/2, avSize/2, 0, Math.PI*2);
    ctx.clip();
    if(img) ctx.drawImage(img, pillX+20, pillY + (headerH-avSize)/2, avSize, avSize);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText(channel, pillX + avSize + 50, pillY + headerH/2 - 5);
    ctx.fillStyle = '#ccc';
    ctx.font = '400 32px Inter, sans-serif';
    ctx.fillText(handle, pillX + avSize + 50, pillY + headerH/2 + 35);

    // Botões Topo (Coração e Share) com Efeito Glass
    const likeX = W - PADDING - headerH/2;
    const shareX = likeX - headerH - 25;
    
    // Like
    drawGlassCircle(ctx, likeX, pillY + headerH/2, headerH/2, img, bgRect);
    drawHeart(ctx, likeX, pillY + headerH/2 - 18, 45);

    // Share
    drawGlassCircle(ctx, shareX, pillY + headerH/2, headerH/2, img, bgRect);
    drawShareIcon(ctx, shareX, pillY + headerH/2, 45);


    // --- PROGRESS BAR ---
    const pY = H - PROGRESS_Y_BOTTOM, pW = W - PADDING * 2, ratio = 0.42;
    ctx.font = `500 ${TIME_SIZE}px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText("0:52", PADDING, pY - 30);
    ctx.textAlign = 'right';
    ctx.fillText("-1:21", W - PADDING, pY - 30);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(PADDING, pY, pW, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(PADDING, pY, pW * ratio, 12, 6);
    ctx.fill();

    // --- CONTROLES INFERIORES ---
    const cY = H - CONTROLS_Y_BOTTOM, cX = W / 2;
    const lX = cX - CONTROLS_GAP, rX = cX + CONTROLS_GAP;

    drawGlassCircle(ctx, lX, cY, SIDE_BTN_RADIUS, img, bgRect);
    drawGlassCircle(ctx, cX, cY, PLAY_BTN_RADIUS, img, bgRect);
    drawGlassCircle(ctx, rX, cY, SIDE_BTN_RADIUS, img, bgRect);

    drawSkipIcon(ctx, lX, cY, SIDE_ICON_SIZE, -1);
    drawPlayIcon(ctx, cX, cY, PLAY_ICON_SIZE);
    drawSkipIcon(ctx, rX, cY, SIDE_ICON_SIZE, 1);

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    res.status(500).send("Erro na geração");
  }
}
