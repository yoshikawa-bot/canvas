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

// Desenha retângulo arredondado (Squircle suave)
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

// Função para truncar texto (adicionar "..." se for muito grande)
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

// Desenha ícones do estilo iOS Call
function drawIOSIcon(ctx, type, cx, cy) {
  ctx.save();
  ctx.strokeStyle = '#D0F468'; // Verde Limão pastel (igual imagem)
  ctx.fillStyle = '#D0F468';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'phone') {
    // Ícone de telefone (handset)
    ctx.beginPath();
    // Simulação simplificada de um telefone curvado
    ctx.arc(cx - 5, cy + 5, 4, 0, Math.PI * 2); // bojo de baixo
    ctx.arc(cx + 8, cy - 8, 4, 0, Math.PI * 2); // bojo de cima
    ctx.fill();
    
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.moveTo(cx - 4, cy + 4);
    ctx.quadraticCurveTo(cx, cy, cx + 7, cy - 7);
    ctx.stroke();
  } 
  else if (type === 'chat') {
    // Balão de fala
    ctx.beginPath();
    // O balão
    ctx.roundRect(cx - 10, cy - 9, 20, 16, 4);
    ctx.fill();
    // A pontinha do balão
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 5);
    ctx.lineTo(cx - 5, cy + 11);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.fill();
  }
  else if (type === 'video') {
    // Câmera de vídeo
    // Corpo da câmera
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 7, 14, 14, 3);
    ctx.fill();
    
    // Lente (triângulo)
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 11, cy - 4);
    ctx.lineTo(cx + 11, cy + 4);
    ctx.closePath();
    ctx.fill();
    
    // Linha vertical interna para detalhe
    ctx.beginPath();
    ctx.strokeStyle = '#222'; // detalhe escuro dentro do icone
    ctx.lineWidth = 2;
    ctx.moveTo(cx - 3, cy - 3);
    ctx.lineTo(cx - 3, cy + 3);
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
      username = "best dude", // Aqui virá o @ID
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    // Dimensões do Canvas (Maior para ter transparência em volta)
    const W = 600;
    const H = 600;
    
    // Dimensões do Widget (O cartão em si)
    const CARD_W = 400;
    const CARD_H = 400;
    const CARD_X = (W - CARD_W) / 2; // Centralizado
    const CARD_Y = (H - CARD_H) / 2;
    const CARD_RADIUS = 55; // Bem arredondado

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 0. Limpar Canvas (Garantir transparência total no fundo)
    ctx.clearRect(0, 0, W, H);

    // 1. DESENHAR O SHADOW (Profundidade)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = 'rgba(0,0,0,0)'; // fill invisivel só para gerar sombra
    drawRoundedRect(ctx, CARD_X + 10, CARD_Y + 10, CARD_W - 20, CARD_H - 20, CARD_RADIUS);
    ctx.fill();
    ctx.restore();

    // 2. FUNDO DO WIDGET (Cinza Escuro estilo iOS)
    ctx.save();
    ctx.fillStyle = '#2C2C2E'; // Cor dark grey do iOS
    drawRoundedRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fill();
    ctx.restore();

    // 3. AVATAR DO USUÁRIO
    const AVATAR_SIZE = 110;
    const AVATAR_X = W / 2;
    const AVATAR_Y = CARD_Y + 80; // Posição vertical do centro do avatar

    ctx.save();
    ctx.beginPath();
    ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    
    const imgAvatar = await loadImage(pp).catch(() => null);
    if (imgAvatar) {
      ctx.drawImage(imgAvatar, AVATAR_X - AVATAR_SIZE/2, AVATAR_Y - AVATAR_SIZE/2, AVATAR_SIZE, AVATAR_SIZE);
    } else {
      ctx.fillStyle = '#555';
      ctx.fillRect(AVATAR_X - AVATAR_SIZE/2, AVATAR_Y - AVATAR_SIZE/2, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    // 4. TEXTOS (Nome e ID)
    ctx.textAlign = 'center';
    
    // Nome (Truncado)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Inter'; // Tamanho ajustado
    const truncatedName = truncateText(ctx, name, CARD_W - 60); // Padding de 30px cada lado
    ctx.fillText(truncatedName, W / 2, AVATAR_Y + 85);

    // Username / ID (Cinza)
    ctx.fillStyle = 'rgba(235, 235, 245, 0.6)'; // Cinza claro transparente
    ctx.font = '18px Inter';
    // Adiciona o @ se não tiver
    const displayHandle = username.startsWith('@') ? username : `@${username}`;
    ctx.fillText(displayHandle, W / 2, AVATAR_Y + 115);

    // 5. BOTÕES DE AÇÃO (Rodapé)
    const BTN_SIZE = 65;
    const BTN_GAP = 25;
    const BTN_Y = CARD_Y + CARD_H - 70; // Ancorado na parte de baixo
    const BTN_BG_COLOR = '#1C1C1E'; // Quase preto

    // Calcular posições X para centralizar o grupo de 3 botões
    const totalBtnWidth = (BTN_SIZE * 3) + (BTN_GAP * 2);
    let startX = (W - totalBtnWidth) / 2;

    const icons = ['phone', 'chat', 'video'];

    icons.forEach((icon, index) => {
      const cx = startX + (BTN_SIZE / 2);
      const cy = BTN_Y;

      // Círculo de fundo escuro
      ctx.beginPath();
      ctx.arc(cx, cy, BTN_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = BTN_BG_COLOR;
      ctx.fill();

      // Ícone geométrico verde
      drawIOSIcon(ctx, icon, cx, cy);

      // Avança X
      startX += BTN_SIZE + BTN_GAP;
    });

    // 6. OUTPUT
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar widget");
  }
}
