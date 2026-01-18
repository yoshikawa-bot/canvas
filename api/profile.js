import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURAÇÃO DE FONTES ---
// Usando o snippet exato que você forneceu
const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
if (!GlobalFonts.has('Inter')) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

// --- 2. FUNÇÕES AUXILIARES DE DESENHO ---

// Desenha um retângulo arredondado
function drawRoundedRect(ctx, x, y, width, height, radius) {
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

// Desenha o efeito de "Tag" (Pílula de vidro)
function drawGlassPill(ctx, text, x, y) {
  // Ajustado para usar apenas 'Inter' (a única registrada)
  ctx.font = '18px Inter'; 
  const padding = 20;
  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + (padding * 2);
  const pillHeight = 36;
  const radius = 18;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, x, y, pillWidth, pillHeight, radius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  // Pequeno ajuste no Y para centralizar verticalmente na fonte Bold
  ctx.fillText(text, x + padding, y + 25); 
  ctx.restore();

  return pillWidth + 10;
}

// Função para desenhar ícones manualmente (Geometria) ao invés de usar fonte/emoji
function drawIconGeometry(ctx, type, cx, cy) {
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'mail') {
    const w = 34;
    const h = 24;
    const x = cx - w/2;
    const y = cy - h/2;
    
    // Envelope box
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    
    // Aba do envelope
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, y + 12);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  } 
  else if (type === 'bell') {
    // Corpo do sino
    ctx.beginPath();
    // Topo arcado
    ctx.arc(cx, cy - 2, 8, Math.PI, 0); 
    // Laterais descendo
    ctx.lineTo(cx + 10, cy + 8); 
    // Base alargada
    ctx.quadraticCurveTo(cx + 12, cy + 10, cx + 14, cy + 10);
    ctx.lineTo(cx - 14, cy + 10);
    ctx.quadraticCurveTo(cx - 12, cy + 10, cx - 10, cy + 8);
    ctx.lineTo(cx - 8, cy - 2);
    ctx.stroke();

    // Pêndulo do sino (bolinha embaixo)
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 3, 0, Math.PI); // Meio circulo para baixo
    ctx.stroke();
    
    // Tracinho no topo
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy - 13);
    ctx.stroke();
  }

  ctx.restore();
}

// --- 3. HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const {
      name = "Pink Sky",
      username = "User ID",
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    // 1. DIMENSÕES AJUSTADAS (CROP)
    // Reduzi H de 900 para 750 para cortar o topo vazio
    const W = 1000;
    const H = 750; 
    
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const imgBg = await loadImage(pp).catch(() => null); 
    const imgAvatar = await loadImage(pp).catch(() => null);

    // 2. FUNDO (BACKGROUND)
    if (imgBg) {
      const scale = Math.max(W / imgBg.width, H / imgBg.height) * 1.2;
      const x = (W - (imgBg.width * scale)) / 2;
      const y = (H - (imgBg.height * scale)) / 2;
      
      ctx.save();
      ctx.filter = 'blur(60px) brightness(0.8) saturate(1.2)';
      ctx.drawImage(imgBg, x, y, imgBg.width * scale, imgBg.height * scale);
      ctx.restore();
    } else {
      ctx.fillStyle = '#2b1020';
      ctx.fillRect(0, 0, W, H);
    }

    // --- GEOMETRIA DO LAYOUT ---
    const CARD_MARGIN = 50;
    const GLASS_H = 550; 
    
    // O vidro começa ancorado no fundo, mas como reduzimos H, ele sobe automaticamente
    // H (750) - GLASS_H (550) - 50 = Y (150). 
    // Antes o Y era 300. Agora o conteúdo começa bem mais perto do topo (Crop effect).
    const GLASS_Y = H - GLASS_H - 50; 
    const GLASS_W = W - (CARD_MARGIN * 2);
    const GLASS_RADIUS = 60;

    const AVATAR_SIZE = 220;
    const AVATAR_RADIUS = AVATAR_SIZE / 2;
    const AVATAR_CX = CARD_MARGIN + 120; 
    const AVATAR_CY = GLASS_Y; 

    // 3. CARTÃO DE VIDRO
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    drawRoundedRect(ctx, CARD_MARGIN, GLASS_Y, GLASS_W, GLASS_H, GLASS_RADIUS);
    
    const grad = ctx.createLinearGradient(CARD_MARGIN, GLASS_Y, CARD_MARGIN, GLASS_Y + GLASS_H);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CARD_MARGIN + GLASS_RADIUS, GLASS_Y);
    ctx.lineTo(CARD_MARGIN + GLASS_W - GLASS_RADIUS, GLASS_Y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 4. AVATAR
    ctx.save();
    ctx.beginPath();
    ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    if (imgAvatar) {
      ctx.drawImage(imgAvatar, AVATAR_CX - AVATAR_RADIUS, AVATAR_CY - AVATAR_RADIUS, AVATAR_SIZE, AVATAR_SIZE);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. TEXTOS
    const TEXT_START_X = CARD_MARGIN + 60; 
    const CONTENT_START_Y = AVATAR_CY + AVATAR_RADIUS + 40; 

    ctx.fillStyle = '#FFFFFF';
    // Alterado para usar apenas 'Inter'
    ctx.font = '64px Inter'; 
    ctx.textBaseline = 'top';
    ctx.fillText(name, TEXT_START_X, CONTENT_START_Y);

    let tagX = TEXT_START_X;
    const tagY = CONTENT_START_Y + 85;
    
    tagX += drawGlassPill(ctx, 'User', tagX, tagY);
    drawGlassPill(ctx, username, tagX, tagY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    // Alterado para 'Inter' (será Bold pois é a única fonte carregada)
    ctx.font = '28px Inter'; 
    const bioText = "Welcome to my profile card. This is an automated visualization of my account status and ID.";
    
    const words = bioText.split(' ');
    let line = '';
    let lineY = tagY + 70;
    const maxWidth = GLASS_W - 120;
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, TEXT_START_X, lineY);
        line = words[n] + ' ';
        lineY += 38;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, TEXT_START_X, lineY);

    // 6. UI INFERIOR (BOTÕES)
    const BUTTON_Y = GLASS_Y + GLASS_H - 130; 
    const BTN_HEIGHT = 80;

    // Botão Grande "+ Follow"
    const btnFollowWidth = 350;
    ctx.save();
    
    const btnGrad = ctx.createLinearGradient(TEXT_START_X, BUTTON_Y, TEXT_START_X, BUTTON_Y + BTN_HEIGHT);
    btnGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    btnGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    
    ctx.fillStyle = btnGrad;
    drawRoundedRect(ctx, TEXT_START_X, BUTTON_Y, btnFollowWidth, BTN_HEIGHT, 40);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    // Alterado para 'Inter'
    ctx.font = '32px Inter'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+  Follow', TEXT_START_X + (btnFollowWidth/2), BUTTON_Y + (BTN_HEIGHT/2));
    ctx.restore();

    // Botões Circulares (Ícones desenhados manualmente)
    const iconSize = 80;
    const iconGap = 20;
    let iconX = TEXT_START_X + btnFollowWidth + 30;

    function drawCircleBtn(x, iconType) {
      // Fundo do círculo
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      const cx = x + iconSize/2;
      const cy = BUTTON_Y + iconSize/2;
      
      ctx.arc(cx, cy, iconSize/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Chama a função de desenho geométrico em vez de fillText
      drawIconGeometry(ctx, iconType, cx, cy);
      ctx.restore();
    }

    // Desenha Mail e Sino
    drawCircleBtn(iconX, 'mail'); 
    drawCircleBtn(iconX + iconSize + iconGap, 'bell');

    // 7. OUTPUT
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar imagem");
  }
}
