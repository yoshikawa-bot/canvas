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

// --- FUNÇÃO DE ÍCONES ATUALIZADA ---
function drawIcon(ctx, type, cx, cy, btnSize) {
  ctx.save();
  ctx.translate(cx, cy);
  
  // Escala para ajustar os ícones dentro do botão (base 105px)
  // Ajuste esse valor se quiser ícones maiores ou menores
  const scale = btnSize / 80; 
  ctx.scale(scale, scale);

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'heart') {
    // Ícone de Coração Preenchido
    ctx.beginPath();
    const topCurveHeight = 12;
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(0, -5, -18, -5, -18, 8);
    ctx.bezierCurveTo(-18, 18, -10, 24, 0, 32);
    ctx.bezierCurveTo(10, 24, 18, 18, 18, 8);
    ctx.bezierCurveTo(18, -5, 0, -5, 0, 10);
    ctx.closePath();
    // Centralizar visualmente
    ctx.translate(0, -10);
    ctx.fill();
  } 
  else if (type === 'share') {
    // Ícone de Compartilhar estilo iOS
    ctx.lineWidth = 3.5;
    
    // Caixa
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-10, 12);
    ctx.quadraticCurveTo(-10, 16, -6, 16);
    ctx.lineTo(6, 16);
    ctx.quadraticCurveTo(10, 16, 10, 12);
    ctx.lineTo(10, -2);
    ctx.stroke();

    // Seta
    ctx.beginPath();
    ctx.moveTo(0, 6);  // Base da seta
    ctx.lineTo(0, -14); // Topo da seta
    ctx.stroke();

    // Ponta da seta
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(0, -15);
    ctx.lineTo(6, -8);
    ctx.stroke();
  }
  else if (type === 'phone') {
    // Ícone de Telefone
    ctx.lineWidth = 4; // Um pouco mais grosso para combinar
    ctx.beginPath();
    // Um desenho de telefone simplificado
    ctx.arc(-7, 7, 3, 0, Math.PI * 2); 
    ctx.arc(8, -8, 3, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.quadraticCurveTo(0, 0, 7, -7);
    ctx.stroke();
    
    // Corpo do telefone (arco)
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.quadraticCurveTo(-15, -15, 5, -8);
    ctx.stroke();
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

    const CREATOR_LID = '29352460828825@lid';
    // [CORREÇÃO] Forçar String(lid) para evitar erro de tipo
    const isCreator = String(lid) === CREATOR_LID;

    // --- DIMENSÕES ---
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

    // 0. Limpar
    ctx.clearRect(0, 0, W, H);

    // 2. DESENHAR O SHAPE DO CARTÃO
    ctx.save();
    drawRoundedRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.clip(); 

    // 2.1 FUNDO COM DESFOQUE
    if (imgAvatar) {
      ctx.filter = 'blur(75px)'; 
      ctx.drawImage(imgAvatar, CARD_X - 50, CARD_Y - 50, CARD_W + 100, CARD_H + 100);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#2C2C2E';
      ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    }

    // 2.2 CAMADA ESCURA (Overlay)
    // [MODIFICAÇÃO] Fundo menos escuro (0.35 em vez de 0.5)
    ctx.fillStyle = 'rgba(15, 15, 15, 0.35)'; 
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);

    ctx.restore(); 

    // --- ELEMENTOS INTERNOS ---

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

    // 4. TEXTOS E TAG
    ctx.textAlign = 'center';

    const nameY = AVATAR_CENTER_Y + (AVATAR_SIZE / 2) + 60;
    const usernameY = nameY + 35;

    // Configuração da fonte do NOME
    const nameFont = '800 38px Inter';
    ctx.font = nameFont;

    // Preparar texto do nome truncado se necessário
    let tName = name;
    const maxNameWidth = CARD_W - 120;
    if (ctx.measureText(tName).width > maxNameWidth) {
         tName = truncateText(ctx, name, maxNameWidth);
    }
    // Medir largura final do nome para posicionar a TAG
    const finalNameWidth = ctx.measureText(tName).width;

    // Desenhar Nome
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = nameFont; // Reaplicar para garantir
    ctx.fillText(tName, W / 2, nameY);
    ctx.restore();

    // --- TAG CRIADOR (Corrigido) ---
    if (isCreator) {
        ctx.save();
        
        const tagText = "CRIADOR";
        const tagFont = '700 14px Inter';
        ctx.font = tagFont;
        
        const tagPaddingX = 10;
        const tagTextWidth = ctx.measureText(tagText).width;
        const tagW = tagTextWidth + (tagPaddingX * 2);
        const tagH = 24;
        const tagRadius = 12;
        
        // Posição calculada com base na largura exata do nome desenhado
        const tagX = (W / 2) + (finalNameWidth / 2) + 15;
        const tagY = nameY - (tagH / 2) - 8; 

        // Sombra suave na tag
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;

        fillRoundedRect(ctx, tagX, tagY, tagW, tagH, tagRadius, '#FF3B30'); 

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);
        
        ctx.restore();
    }

    // Username
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; 
    ctx.font = '600 22px Inter'; 
    ctx.fillText(username, W / 2, usernameY);
    ctx.restore();

    // 5. BOTÕES DE AÇÃO (EFEITO VIDRO)
    const BTN_Y = CARD_Y + CARD_H - (BTN_SIZE / 2) - 55; 
    
    // [MODIFICAÇÃO] Ícones solicitados
    const icons = ['heart', 'share', 'phone'];
    
    const totalW = (BTN_SIZE * 3) + (BTN_GAP * 2);
    let startX = (W - totalW) / 2;

    icons.forEach((icon) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

      ctx.save();
      
      // Sombra do botão
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      // Desenhar círculo
      ctx.beginPath();
      ctx.arc(cx, cy, BTN_SIZE / 2, 0, Math.PI * 2);
      
      // [MODIFICAÇÃO] Efeito de Vidro (Fundo translúcido + Borda)
      // Preenchimento claro/branco bem transparente
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
      ctx.fill();
      
      // Borda (Stroke) para dar definição ao vidro
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      ctx.restore();

      // Desenhar o ícone por cima
      drawIcon(ctx, icon, cx, cy, BTN_SIZE);

      startX += BTN_SIZE + BTN_GAP;
    });

    // 6. ENVIAR RESPOSTA
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
}
