import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURAÇÃO DE FONTES ---
const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');

if (!GlobalFonts.has('Inter')) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

// --- 2. FUNÇÕES AUXILIARES ---

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

// --- FUNÇÃO DE ÍCONES CORRIGIDA (PROPORCIONAL E CENTRALIZADA) ---
function drawIcon(ctx, type, cx, cy, btnSize) {
  ctx.save();
  ctx.translate(cx, cy);

  // Define o tamanho visual do ícone como 42% do botão para manter respiro (padding)
  const iconArea = btnSize * 0.42;
  // Escala baseada em um grid padrão de 24px (estilo Material/Lucide)
  const scale = iconArea / 24;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.2; 

  if (type === 'heart') {
    // CORAÇÃO SÓLIDO
    ctx.translate(0, 1); // Ajuste fino de centro gravitacional
    ctx.beginPath();
    ctx.moveTo(0, 8); 
    ctx.bezierCurveTo(0, 8, -11, -2, -11, -7);
    ctx.bezierCurveTo(-11, -11, -8, -13, -5, -13);
    ctx.bezierCurveTo(-2, -13, 0, -10, 0, -10);
    ctx.bezierCurveTo(0, -10, 2, -13, 5, -13);
    ctx.bezierCurveTo(8, -13, 11, -11, 11, -7);
    ctx.bezierCurveTo(11, -2, 0, 8, 0, 8);
    ctx.closePath();
    ctx.fill();
  } 
  else if (type === 'share') {
    // COMPARTILHAR (Seta para fora)
    ctx.translate(0, 1);
    // Seta
    ctx.beginPath();
    ctx.moveTo(0, 2);   
    ctx.lineTo(0, -11); 
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -7); 
    ctx.lineTo(0, -11); 
    ctx.lineTo(4, -7);  
    ctx.stroke();
    // Base/Caixa
    ctx.beginPath();
    ctx.moveTo(-7, -1); 
    ctx.lineTo(-7, 9);  
    ctx.quadraticCurveTo(-7, 11, -5, 11); 
    ctx.lineTo(5, 11);  
    ctx.quadraticCurveTo(7, 11, 7, 9);    
    ctx.lineTo(7, -1);  
    ctx.stroke();
  }
  else if (type === 'phone') {
    // TELEFONE (Estilo Handset Sólido)
    ctx.rotate((Math.PI / 180) * -45); // Rotação diagonal clássica
    ctx.beginPath();
    // Desenho simétrico em torno do centro (0,0)
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(0, 5, 8, 3);
    ctx.quadraticCurveTo(10, 2, 10, -1);
    ctx.quadraticCurveTo(10, -4, 8, -5);
    ctx.lineTo(6, -5);
    ctx.quadraticCurveTo(4, -5, 4, -3);
    ctx.quadraticCurveTo(0, -1, -4, -3);
    ctx.quadraticCurveTo(-4, -5, -6, -5);
    ctx.lineTo(-8, -5);
    ctx.quadraticCurveTo(-10, -4, -10, -1);
    ctx.quadraticCurveTo(-10, 2, -8, 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// --- 3. HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const {
      name = "Zion Carter",
      username = "best dude",
      lid = "", 
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    const CREATOR_ID_STRING = 'Yoshikawa Profile';
    const isCreator = String(lid).trim() === CREATOR_ID_STRING;

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

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const imgAvatar = await loadImage(pp).catch(() => null);

    ctx.clearRect(0, 0, W, H);

    // 2. FUNDO E CLIP DO CARTÃO
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

    // 3. AVATAR
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

    // 4. TEXTOS
    ctx.textAlign = 'center';
    const nameY = AVATAR_CENTER_Y + (AVATAR_SIZE / 2) + 60;
    const usernameY = nameY + 35;

    ctx.font = '800 38px Inter';
    let tName = name;
    if (ctx.measureText(tName).width > CARD_W - 120) {
         tName = truncateText(ctx, name, CARD_W - 120);
    }
    const finalNameWidth = ctx.measureText(tName).width;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tName, W / 2, nameY);
    ctx.restore();

    if (isCreator) {
        ctx.save();
        const tagText = "CRIADOR";
        ctx.font = '700 14px Inter';
        const tagTextWidth = ctx.measureText(tagText).width;
        const tagW = tagTextWidth + 20;
        const tagH = 24;
        const tagX = (W / 2) + (finalNameWidth / 2) + 15;
        const tagY = nameY - (tagH / 2) - 8; 
        fillRoundedRect(ctx, tagX, tagY, tagW, tagH, 12, '#FF3B30'); 
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; 
    ctx.font = '600 22px Inter'; 
    ctx.fillText(username, W / 2, usernameY);
    ctx.restore();

    // 5. BOTÕES DE AÇÃO
    const BTN_Y = CARD_Y + CARD_H - (BTN_SIZE / 2) - 55; 
    const icons = ['heart', 'share', 'phone'];
    const totalButtonsW = (BTN_SIZE * icons.length) + (BTN_GAP * (icons.length - 1));
    let startX = (W - totalButtonsW) / 2;

    icons.forEach((icon) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

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

      // Chamada da função de ícones corrigida
      drawIcon(ctx, icon, cx, cy, BTN_SIZE);

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
