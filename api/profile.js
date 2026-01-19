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

// --- ÍCONES VETORIAIS (mesmo estilo do player) ---

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

function drawPhoneIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = size * 0.45;
  const h = size * 0.85;

  // Corpo do telefone
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, w / 5);
  ctx.stroke();

  // Alto-falante
  const speakerW = w * 0.7;
  const speakerY = -h / 2 + h * 0.15;
  ctx.beginPath();
  ctx.moveTo(-speakerW / 2, speakerY);
  ctx.lineTo(speakerW / 2, speakerY);
  ctx.stroke();

  // Botão home
  const buttonR = w * 0.15;
  const buttonY = h / 2 - h * 0.15;
  ctx.beginPath();
  ctx.arc(0, buttonY, buttonR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// --- EFEITOS GLASS ---

function drawGlassCircle(ctx, centerX, centerY, radius, bgImg, bgRect) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
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

// --- HANDLER ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONFIG ADESIVO ---
    const DESIGN_RES = 1080;
    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;

    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    // --- MEDIDAS ---
    const W = DESIGN_RES, H = DESIGN_RES;
    const PADDING = 90;
    const CARD_RADIUS = 120;
    const BG_ZOOM = 1.9;

    const headerH = 220;
    const pillRadius = headerH / 2;
    const avSize = 140;
    const avMargin = 40;

    const CONTROLS_Y_BOTTOM = 160;
    const CONTROLS_GAP = 240;
    const SIDE_BTN_RADIUS = 75;
    const PLAY_BTN_RADIUS = 100;
    const SIDE_ICON_SIZE = 55;
    const PLAY_ICON_SIZE = 80;

    const {
      name = "Zion Carter",
      username = "best dude",
      lid = "",
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    const isCreator = String(lid).trim() === 'Yoshikawa Profile';

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- ÁREA ADESIVO ---
    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    let img = null;
    try {
      if (pp && pp.startsWith('http')) {
        const response = await fetch(pp);
        const buf = Buffer.from(await response.arrayBuffer());
        img = await loadImage(buf);
      }
    } catch (e) { }

    // Clip geral arredondado
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // Fundo
    let bgRect = { x: 0, y: 0, w: W, h: H };
    if (img) {
      const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM;
      bgRect = {
        w: img.width * scale,
        h: img.height * scale,
        x: (W - img.width * scale) / 2,
        y: (H - img.height * scale) / 2
      };
      ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // --- HEADER PÍLULA ---
    const pillX = PADDING;
    const pillY = PADDING;
    const pillWidth = W - PADDING * 2;

    drawGlassRect(ctx, pillX, pillY, pillWidth, headerH, pillRadius, img, bgRect);

    // Avatar
    const avCenterX = pillX + avMargin + avSize / 2;
    const avCenterY = pillY + headerH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avCenterX, avCenterY, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    if (img) ctx.drawImage(img, avCenterX - avSize / 2, avCenterY - avSize / 2, avSize, avSize);
    ctx.restore();

    // Textos
    const textStartX = avCenterX + avSize / 2 + 40;
    const maxTextWidth = pillWidth - (avMargin * 2 + avSize + 80); // espaço seguro

    // Nome
    ctx.textAlign = 'left';
    ctx.font = 'bold 62px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    let displayName = name;
    if (ctx.measureText(name).width > maxTextWidth) {
      displayName = name;
      while (ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    const nameY = pillY + headerH / 2 - 25;
    ctx.fillText(displayName, textStartX, nameY);
    const nameWidth = ctx.measureText(displayName).width;

    // Username
    ctx.font = '400 42px Inter, sans-serif';
    ctx.fillStyle = '#ccc';
    let displayUsername = username;
    if (ctx.measureText(username).width > maxTextWidth) {
      displayUsername = username;
      while (ctx.measureText(displayUsername + '...').width > maxTextWidth && displayUsername.length > 0) {
        displayUsername = displayUsername.slice(0, -1);
      }
      displayUsername += '...';
    }
    ctx.fillText(displayUsername, textStartX, nameY + 60);

    // Tag CRIADOR
    if (isCreator) {
      const tagText = "CRIADOR";
      ctx.font = 'bold 36px Inter, sans-serif';
      const tagTextW = ctx.measureText(tagText).width;
      const tagPadX = 40;
      const tagH = 56;
      const tagW = tagTextW + tagPadX;
      const tagRadius = tagH / 2;

      let tagX = textStartX + nameWidth + 30;
      let tagY = nameY - tagH / 2;

      ctx.fillStyle = '#FF3B30';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, tagRadius);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // --- BOTÕES INFERIORES ---
    const cY = H - CONTROLS_Y_BOTTOM;
    const cX = W / 2;
    const lX = cX - CONTROLS_GAP;
    const rX = cX + CONTROLS_GAP;

    drawGlassCircle(ctx, lX, cY, SIDE_BTN_RADIUS, img, bgRect);
    drawGlassCircle(ctx, cX, cY, PLAY_BTN_RADIUS, img, bgRect);
    drawGlassCircle(ctx, rX, cY, SIDE_BTN_RADIUS, img, bgRect);

    drawHeart(ctx, lX, cY, SIDE_ICON_SIZE);
    drawPhoneIcon(ctx, cX, cY, PLAY_ICON_SIZE);
    drawShareIcon(ctx, rX, cY, SIDE_ICON_SIZE);

    ctx.restore(); // fim da escala/translate

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
      }
