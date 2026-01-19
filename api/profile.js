import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DE FONTES ---
const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');

if (!GlobalFonts.has('Inter')) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

// --- FUNÇÕES AUXILIARES ---
function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function truncateText(ctx, text, maxWidth) {
  let width = ctx.measureText(text).width;
  if (width <= maxWidth) return text;
  let truncated = text;
  while (width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    width = ctx.measureText(truncated + '...').width;
  }
  return truncated + '...';
}

// --- ÍCONES MELHORADOS (mais nítidos, proporcionais e no mesmo estilo premium do player) ---
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
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = size * 0.45;
  const h = size * 0.85;

  // Corpo do telefone (retângulo arredondado)
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, w / 5);
  ctx.stroke();

  // Alto-falante (linha horizontal no topo)
  const speakerW = w * 0.65;
  const speakerY = -h / 2 + h * 0.18;
  ctx.beginPath();
  ctx.moveTo(-speakerW / 2, speakerY);
  ctx.lineTo(speakerW / 2, speakerY);
  ctx.stroke();

  // Botão home / microfone (círculo na base)
  const buttonR = w * 0.18;
  const buttonY = h / 2 - h * 0.18;
  ctx.beginPath();
  ctx.arc(0, buttonY, buttonR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// --- HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const {
      name = "Zion Carter",
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
      // username e lid são ignorados agora
    } = req.method === "POST" ? req.body : req.query;

    const DISPLAY_SUBTITLE = "Yoshikawa Profile"; // Sempre exibido abaixo do nome

    const W = 600; 
    const H = 600;
    const CARD_W = 550;
    const CARD_H = 550;
    const CARD_X = (W - CARD_W) / 2;
    const CARD_Y = (H - CARD_H) / 2;
    const CARD_RADIUS = 95; 

    const AVATAR_SIZE = 180; 
    const BTN_SIZE = 105;    
    const BTN_GAP = 40;      
    const ICON_SIZE = 55;    // Tamanho ótimo para ficar bem centralizado e nítido

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const imgAvatar = await loadImage(pp).catch(() => null);

    ctx.clearRect(0, 0, W, H);

    // Fundo e clip do cartão (mantendo o design antigo)
    ctx.save();
    drawRoundedRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.clip(); 

    if (imgAvatar) {
      ctx.filter = 'blur(75px)'; 
      ctx.drawImage(imgAvatar, CARD_X - 50, CARD_Y - 50, CARD_W + 100, CARD_H + 100);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#2C2C2E';
      ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    }

    ctx.fillStyle = 'rgba(15, 15, 15, 0.35)'; 
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    ctx.restore(); 

    // Avatar com sombra (design antigo)
    const AVATAR_CENTER_X = W / 2;
    const AVATAR_CENTER_Y = CARD_Y + 130; 

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    
    ctx.beginPath();
    ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; 
    ctx.fill(); 

    ctx.shadowColor = 'transparent';
    ctx.clip(); 

    if (imgAvatar) {
      ctx.drawImage(imgAvatar, AVATAR_CENTER_X - AVATAR_SIZE/2, AVATAR_CENTER_Y - AVATAR_SIZE/2, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    // Textos
    ctx.textAlign = 'center';
    const nameY = AVATAR_CENTER_Y + (AVATAR_SIZE / 2) + 60;
    const subtitleY = nameY + 35;

    // Nome com truncate
    ctx.font = '800 38px Inter';
    let tName = name;
    if (ctx.measureText(tName).width > CARD_W - 120) {
      tName = truncateText(ctx, name, CARD_W - 120);
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tName, W / 2, nameY);
    ctx.restore();

    // Subtitle fixo "Yoshikawa Profile" (substituindo username/lid)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; 
    ctx.font = '600 22px Inter'; 
    ctx.fillText(DISPLAY_SUBTITLE, W / 2, subtitleY);
    ctx.restore();

    // Botões de ação (design antigo mantido, mas ícones muito mais bem desenhados)
    const BTN_Y = CARD_Y + CARD_H - (BTN_SIZE / 2) - 55; 
    const icons = ['heart', 'phone', 'share']; // Ordem ajustada para phone no centro (melhor UX, call como ação principal)

    const totalButtonsW = (BTN_SIZE * icons.length) + (BTN_GAP * (icons.length - 1));
    let startX = (W - totalButtonsW) / 2;

    icons.forEach((icon) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

      // Botão glass-like com sombra (design antigo)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, BTN_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();
      ctx.restore();

      // Ícones novos e bem desenhados
      if (icon === 'heart') drawHeart(ctx, cx, cy, ICON_SIZE);
      else if (icon === 'phone') drawPhoneIcon(ctx, cx, cy, ICON_SIZE);
      else if (icon === 'share') drawShareIcon(ctx, cx, cy, ICON_SIZE);

      startX += BTN_SIZE + BTN_GAP;
    });

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
}
