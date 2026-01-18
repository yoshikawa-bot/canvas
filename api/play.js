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

// FUNÇÃO CORAÇÃO (Formato Emoji ❤️)
function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const s = size * 0.9; 
  ctx.moveTo(0, s * 0.45); 
  ctx.bezierCurveTo(-s * 0.7, s * 0.1, -s * 0.6, -s * 0.6, 0, -s * 0.25);
  ctx.bezierCurveTo(s * 0.6, -s * 0.6, s * 0.7, s * 0.1, 0, s * 0.45);
  ctx.fill();
  ctx.restore();
}

// FUNÇÃO COMPARTILHAR
function drawShareIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size * 0.85;
  const boxW = s * 0.55;
  const boxTopY = -s * 0.1;
  const boxBottomY = s * 0.6;
  const gapW = s * 0.22;
  ctx.beginPath();
  ctx.moveTo(-gapW, boxTopY);
  ctx.lineTo(-boxW, boxTopY);
  ctx.lineTo(-boxW, boxBottomY);
  ctx.lineTo(boxW, boxBottomY);
  ctx.lineTo(boxW, boxTopY);
  ctx.lineTo(gapW, boxTopY);
  ctx.stroke();
  const arrowScale = 0.92;
  const arrowTipY = -s * 0.75 * arrowScale;
  const arrowBaseY = s * 0.1 * arrowScale;
  const arrowHeadH = s * 0.25 * arrowScale;
  const arrowHeadW = s * 0.35 * arrowScale;
  ctx.beginPath();
  ctx.moveTo(0, arrowBaseY);
  ctx.lineTo(0, arrowTipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-arrowHeadW, arrowTipY + arrowHeadH);
  ctx.lineTo(0, arrowTipY);
  ctx.lineTo(arrowHeadW, arrowTipY + arrowHeadH);
  ctx.stroke();
  ctx.restore();
}

// Função genérica para efeito de vidro em Círculos
// ATUALIZADO: Aceita o gradiente (overlayGrad) para igualar a iluminação
function drawGlassCircle(ctx, centerX, centerY, radius, bgImg, bgRect, overlayGrad) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(20px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';
  
  // CORREÇÃO: Aplica o gradiente do fundo dentro do vidro para manter consistência
  if (overlayGrad) {
      ctx.fillStyle = overlayGrad;
      ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// Função genérica para efeito de vidro em Retângulos Arredondados (Pílula)
// ATUALIZADO: Aceita o gradiente (overlayGrad) para igualar a iluminação
function drawGlassRect(ctx, x, y, w, h, radius, bgImg, bgRect, overlayGrad) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(20px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';

  // CORREÇÃO: Aplica o gradiente do fundo dentro do vidro para manter consistência
  if (overlayGrad) {
      ctx.fillStyle = overlayGrad;
      ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
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
    const CONTROLS_Y_BOTTOM = 140, CONTROLS_GAP = 260;
    const PLAY_BTN_RADIUS = 80, SIDE_BTN_RADIUS = 80;
    const PLAY_ICON_SIZE = 70, SIDE_ICON_SIZE = 40;
    const PROGRESS_Y_BOTTOM = 360, TIME_SIZE = 48;
    const BG_ZOOM = 1.9;

    const {
      channel = "Terence Howard",
      handle = "@kawalyansky",
      thumbnail = "https://i.scdn.co/image/ab67616d0000b273b5f0709d2243e8cb9e623d61",
      totalTime = "2:13"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- INÍCIO DA ÁREA DO "ADESIVO" ---
    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

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

    // Pílula com efeito de vidro (Passando 'grad' agora)
    drawGlassRect(ctx, pillX, pillY, pillWidth, headerH, headerH/2, img, bgRect, grad);
    
    // Avatar circular
    const avSize = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pillX + 20 + avSize/2, pillY + headerH/2, avSize/2, 0, Math.PI*2);
    ctx.clip();
    if(img) ctx.drawImage(img, pillX+20, pillY + (headerH-avSize)/2, avSize, avSize);
    ctx.restore();

    // -- ATUALIZADO: Lógica de texto com "..." --
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Inter, sans-serif';

    const textStartX = pillX + avSize + 50;
    const maxTextWidth = pillWidth - (avSize + 50) - 20; 
    let displayChannel = channel;

    if (ctx.measureText(displayChannel).width > maxTextWidth) {
      while (ctx.measureText(displayChannel + '...').width > maxTextWidth && displayChannel.length > 0) {
        displayChannel = displayChannel.slice(0, -1);
      }
      displayChannel += '...';
    }

    ctx.fillText(displayChannel, textStartX, pillY + headerH/2 - 5);
    
    ctx.fillStyle = '#ccc';
    ctx.font = '400 32px Inter, sans-serif';
    ctx.fillText(handle, pillX + avSize + 50, pillY + headerH/2 + 35);

    // --- BOTÕES DE TOPO (Heart e Share) ---
    const likeX = W - PADDING - headerH/2;
    const shareX = likeX - headerH - 10;
    const topIconSize = 52; 

    // Botão Share (Passando 'grad')
    drawGlassCircle(ctx, shareX, pillY + headerH/2, headerH/2, img, bgRect, grad);
    drawShareIcon(ctx, shareX, pillY + headerH/2, topIconSize);

    // Botão Like (Passando 'grad')
    drawGlassCircle(ctx, likeX, pillY + headerH/2, headerH/2, img, bgRect, grad);
    drawHeart(ctx, likeX, pillY + headerH/2, topIconSize); 

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

    // Aplicando drawGlassCircle com o gradiente ('grad') passado no final
    drawGlassCircle(ctx, lX, cY, SIDE_BTN_RADIUS, img, bgRect, grad);
    drawGlassCircle(ctx, cX, cY, PLAY_BTN_RADIUS, img, bgRect, grad);
    drawGlassCircle(ctx, rX, cY, SIDE_BTN_RADIUS, img, bgRect, grad);

    // Ícones sobrepostos aos botões de vidro
    drawSkipIcon(ctx, lX, cY, SIDE_ICON_SIZE, -1);
    drawPlayIcon(ctx, cX, cY, PLAY_ICON_SIZE);
    drawSkipIcon(ctx, rX, cY, SIDE_ICON_SIZE, 1);

    // --- FIM DA ÁREA DO "ADESIVO" ---
    ctx.restore(); 

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
}
