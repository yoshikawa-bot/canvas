import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURAÇÃO DE FONTES ---
// Certifique-se de ter a fonte Inter ou SF Pro no caminho correto
const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf'); // Ajuste o nome do arquivo se necessário (ex: Inter_18pt-Bold.ttf)
// Tenta registrar variações se tiverem nomes diferentes
if (!GlobalFonts.has('Inter')) {
    try { GlobalFonts.registerFromPath(fontPath, 'Inter'); } catch (e) { console.log("Erro fonte principal, tentando fallback"); }
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

// Função auxiliar para desenhar rect preenchido arredondado (usado na tag)
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

// Desenha ícones (Ajustados para ficarem maiores e mais nítidos)
function drawIOSIcon(ctx, type, cx, cy, scaleSize) {
  ctx.save();
  // Cor do ícone (Verde Limão)
  ctx.fillStyle = '#D0F468'; 
  ctx.strokeStyle = '#D0F468';
  
  // Fator de escala baseado no tamanho do botão original vs novo
  const scale = scaleSize / 75; // 75 era o tamanho base anterior
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  if (type === 'phone') {
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - 6, cy + 6, 4, 0, Math.PI * 2); 
    ctx.arc(cx + 9, cy - 9, 4, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 5);
    ctx.quadraticCurveTo(cx, cy, cx + 8, cy - 8);
    ctx.stroke();
  } 
  else if (type === 'chat') {
    ctx.beginPath();
    ctx.roundRect(cx - 12, cy - 11, 24, 19, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 7);
    ctx.lineTo(cx - 8, cy + 14);
    ctx.lineTo(cx + 5, cy + 7);
    ctx.fill();
  }
  else if (type === 'video') {
    ctx.beginPath();
    ctx.roundRect(cx - 13, cy - 9, 18, 16, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy);
    ctx.lineTo(cx + 14, cy - 6);
    ctx.lineTo(cx + 14, cy + 6);
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
      // Adicionado o LID para verificação
      lid = "", 
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    // ID do Criador para verificação
    const CREATOR_LID = '29352460828825@lid';
    const isCreator = lid === CREATOR_LID;

    // --- DIMENSÕES E CONSTANTES AJUSTADAS ---
    const W = 600; 
    const H = 600;
    
    const CARD_W = 550;
    const CARD_H = 550;
    const CARD_X = (W - CARD_W) / 2;
    const CARD_Y = (H - CARD_H) / 2;
    
    // [MODIFICADO] Cantos muito mais arredondados
    const CARD_RADIUS = 95; 

    // [MODIFICADO] Tamanhos e espaçamentos aumentados
    const AVATAR_SIZE = 180; // Foto maior
    const BTN_SIZE = 105;    // Botões muito maiores
    const BTN_GAP = 40;      // Mais espaço entre botões

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const imgAvatar = await loadImage(pp).catch(() => null);

    // 0. Limpar e fundo transparente
    ctx.clearRect(0, 0, W, H);

    // [REMOVIDO] 1. SOMBRA DO CARTÃO PRINCIPAL (Glow externo) - Removido conforme solicitado

    // 2. DESENHAR O SHAPE DO CARTÃO (Para clipar o fundo)
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

    // 2.2 CAMADA ESCURA (Overlay) - Mantida para legibilidade do texto
    ctx.fillStyle = 'rgba(15, 15, 15, 0.5)'; 
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);

    ctx.restore(); // Remove o clip do cartão principal

    // --- ELEMENTOS INTERNOS ---

    // 3. AVATAR (Foto de perfil)
    const AVATAR_CENTER_X = W / 2;
    // [MODIFICADO] Posição Y ajustada para cima para dar mais espaço
    const AVATAR_CENTER_Y = CARD_Y + 130; 

    ctx.save();
    // Sombra do componente interno (Mantida)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    
    ctx.beginPath();
    ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; 
    ctx.fill(); 

    // Clipar para a imagem
    ctx.shadowColor = 'transparent';
    ctx.clip(); 

    if (imgAvatar) {
      ctx.drawImage(imgAvatar, AVATAR_CENTER_X - AVATAR_SIZE/2, AVATAR_CENTER_Y - AVATAR_SIZE/2, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    // 4. TEXTOS
    ctx.textAlign = 'center';

    // [MODIFICADO] Posições Y dos textos ajustadas para o novo tamanho do avatar e espaçamento
    const nameY = AVATAR_CENTER_Y + (AVATAR_SIZE / 2) + 60;
    const usernameY = nameY + 35;

    // Nome
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; // Sombra interna do texto (mantida)
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    // Fonte ligeiramente maior
    ctx.font = '800 38px Inter'; 
    
    // Cálculo para truncar e posicionar a tag se necessário
    let tName = name;
    const maxNameWidth = CARD_W - 120; // Margem de segurança
    let nameWidth = ctx.measureText(tName).width;

    if (nameWidth > maxNameWidth) {
         tName = truncateText(ctx, name, maxNameWidth);
         nameWidth = ctx.measureText(tName).width;
    }
    
    ctx.fillText(tName, W / 2, nameY);
    ctx.restore();

    // --- [NOVO] LÓGICA DA TAG CRIADOR ---
    if (isCreator) {
        ctx.save();
        ctx.font = '800 38px Inter'; // Mesma fonte para medir corretamente
        const actualNameWidth = ctx.measureText(tName).width;
        
        // Configuração da Tag
        const tagText = "CRIADOR";
        const tagFont = '700 14px Inter';
        ctx.font = tagFont;
        const tagPaddingX = 10;
        const tagPaddingY = 5;
        const tagTextWidth = ctx.measureText(tagText).width;
        const tagW = tagTextWidth + (tagPaddingX * 2);
        const tagH = 24;
        const tagRadius = 12;
        
        // Posição da Tag (à direita do nome)
        const tagX = (W / 2) + (actualNameWidth / 2) + 15;
        // Ajuste fino vertical para alinhar com o centro ótico do nome
        const tagY = nameY - (tagH / 2) - 8; 

        // Sombra leve na tag
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;

        // Desenha o fundo vermelho da tag
        fillRoundedRect(ctx, tagX, tagY, tagW, tagH, tagRadius, '#FF3B30'); // Vermelho estilo iOS

        // Desenha o texto da tag
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'white';
        ctx.font = tagFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);
        
        ctx.restore();
    }
    // ------------------------------------


    // Username
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; // Sombra interna do texto (mantida)
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; 
    ctx.font = '600 22px Inter'; // Fonte ligeiramente maior
    ctx.fillText(username, W / 2, usernameY);
    ctx.restore();

    // 5. BOTÕES DE AÇÃO
    // [MODIFICADO] Posição Y recalculada para os botões maiores não baterem na borda inferior
    const BTN_Y = CARD_Y + CARD_H - (BTN_SIZE / 2) - 55; 
    
    const BTN_BG_COLOR = 'rgba(40, 40, 40, 0.9)'; // Um pouco mais claro e opaco

    const icons = ['phone', 'chat', 'video'];
    
    const totalW = (BTN_SIZE * 3) + (BTN_GAP * 2);
    let startX = (W - totalW) / 2;

    icons.forEach((icon) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

      ctx.save();
      // Sombra dos componentes internos (Mantida e ajustada para o tamanho)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;

      ctx.beginPath();
      ctx.arc(cx, cy, BTN_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = BTN_BG_COLOR;
      ctx.fill();
      ctx.restore();

      // Desenha ícone (passando o novo tamanho para escala)
      drawIOSIcon(ctx, icon, cx, cy, BTN_SIZE);

      startX += BTN_SIZE + BTN_GAP;
    });

    // 6. ENVIAR RESPOSTA
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    // Cache control opcional para performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
}
