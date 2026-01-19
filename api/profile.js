import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURAÇÃO DE FONTES ---
// Certifique-se de ter a fonte Inter ou SF Pro
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
function drawIOSIcon(ctx, type, cx, cy) {
  ctx.save();
  // Cor do ícone (Verde Limão)
  ctx.fillStyle = '#D0F468'; 
  ctx.strokeStyle = '#D0F468';
  
  // Sombra interna do ícone para dar um leve destaque 3D (opcional, mas ajuda no realismo)
  // ctx.shadowColor = 'rgba(0,0,0,0.2)';
  // ctx.shadowBlur = 2;

  if (type === 'phone') {
    // Handset mais robusto
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
    // Balão preenchido sólido
    ctx.beginPath();
    ctx.roundRect(cx - 12, cy - 11, 24, 19, 6);
    ctx.fill();
    // Ponta do balão
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 7);
    ctx.lineTo(cx - 8, cy + 14);
    ctx.lineTo(cx + 5, cy + 7);
    ctx.fill();
  }
  else if (type === 'video') {
    // Câmera
    ctx.beginPath();
    ctx.roundRect(cx - 13, cy - 9, 18, 16, 4);
    ctx.fill();
    // Lente triangular
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
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    // --- DIMENSÕES AJUSTADAS ---
    const W = 600; // Canvas total
    const H = 600;
    
    // O cartão agora é 550x550 (proporção mais próxima da imagem)
    const CARD_W = 550;
    const CARD_H = 550;
    
    // Centraliza o cartão no canvas
    const CARD_X = (W - CARD_W) / 2;
    const CARD_Y = (H - CARD_H) / 2;
    const CARD_RADIUS = 60; // Curvatura estilo iOS

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Carregar imagem de perfil antes (será usada no fundo e no avatar)
    const imgAvatar = await loadImage(pp).catch(() => null);

    // 0. Limpar
    ctx.clearRect(0, 0, W, H);

    // 1. SOMBRA DO CARTÃO PRINCIPAL (Glow externo)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; // Sombra mais escura
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.fillStyle = 'black'; 
    // Desenha um rect menor para gerar a sombra sem vazar pixels feios
    drawRoundedRectPath(ctx, CARD_X + 20, CARD_Y + 20, CARD_W - 40, CARD_H - 40, CARD_RADIUS);
    ctx.fill();
    ctx.restore();

    // 2. DESENHAR O SHAPE DO CARTÃO (Para clipar o fundo)
    ctx.save();
    drawRoundedRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.clip(); // Tudo desenhado aqui dentro será cortado no formato do cartão

    // 2.1 FUNDO COM DESFOQUE VIOLENTO
    if (imgAvatar) {
      ctx.filter = 'blur(70px)'; // Desfoque muito forte
      // Desenha a imagem esticada para cobrir todo o card + sangria para evitar bordas brancas no blur
      ctx.drawImage(imgAvatar, CARD_X - 50, CARD_Y - 50, CARD_W + 100, CARD_H + 100);
      ctx.filter = 'none'; // Reseta filtro
    } else {
      ctx.fillStyle = '#2C2C2E';
      ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    }

    // 2.2 CAMADA ESCURA (Overlay)
    // Para garantir que o texto branco seja legível independente da foto
    ctx.fillStyle = 'rgba(20, 20, 20, 0.45)'; 
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);

    // Soltar o clip do cartão para desenhar os elementos internos (sombras precisam funcionar)
    // Na verdade, mantemos o clip? Não, o clip cortaria as sombras dos elementos se elas saíssem da borda.
    // Mas como tudo é interno, ok. Mas vou dar restore por segurança.
    ctx.restore();

    // --- DAQUI PRA BAIXO, DESENHAMOS DENTRO DA ÁREA DO CARD ---

    // 3. AVATAR (Foto de perfil redonda)
    const AVATAR_SIZE = 130; // Aumentei um pouco
    const AVATAR_CENTER_X = W / 2;
    const AVATAR_CENTER_Y = CARD_Y + 140; // Posição Y ajustada

    ctx.save();
    // Sombra do Avatar
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    
    ctx.beginPath();
    ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; // Cor base caso falhe imagem
    ctx.fill(); // Aplica a sombra aqui

    // Clipar para a imagem
    ctx.shadowColor = 'transparent'; // Remove sombra para não aplicar na imagem interna
    ctx.clip(); 

    if (imgAvatar) {
      ctx.drawImage(imgAvatar, AVATAR_CENTER_X - AVATAR_SIZE/2, AVATAR_CENTER_Y - AVATAR_SIZE/2, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    // 4. TEXTOS
    ctx.textAlign = 'center';

    // Nome
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; // Sombra no texto
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 36px Inter'; // Mais bold e maior
    const tName = truncateText(ctx, name, CARD_W - 80);
    ctx.fillText(tName, W / 2, AVATAR_CENTER_Y + 100);
    ctx.restore();

    // Username / Status (Sem o @)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; // Sombra no texto
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Branco transparente em vez de cinza
    ctx.font = '600 20px Inter';
    // Remove lógica do @. Imprime o que veio.
    ctx.fillText(username, W / 2, AVATAR_CENTER_Y + 135);
    ctx.restore();

    // 5. BOTÕES DE AÇÃO
    const BTN_SIZE = 75; // Botões maiores
    const BTN_GAP = 30; // Mais espaço entre eles
    const BTN_Y = CARD_Y + CARD_H - 100; // Ancorado no fundo com margem
    
    // Cor de fundo do botão (Cinza quase preto, semi-transparente para mesclar com o blur)
    const BTN_BG_COLOR = 'rgba(30, 30, 30, 0.85)'; 

    const icons = ['phone', 'chat', 'video'];
    
    // Calculo para centralizar
    const totalW = (BTN_SIZE * 3) + (BTN_GAP * 2);
    let startX = (W - totalW) / 2;

    icons.forEach((icon) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

      ctx.save();
      // Sombra do Botão
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      ctx.beginPath();
      ctx.arc(cx, cy, BTN_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = BTN_BG_COLOR;
      ctx.fill();
      ctx.restore();

      // Desenha ícone
      drawIOSIcon(ctx, icon, cx, cy);

      startX += BTN_SIZE + BTN_GAP;
    });

    // 6. ENVIAR RESPOSTA
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
}

