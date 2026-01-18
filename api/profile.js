import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CARREGAMENTO DE FONTES ---
try {
  const fontPathBold = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  const fontPathRegular = path.join(__dirname, '../fonts/Inter-Regular.ttf'); // Opcional, caso tenha
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPathBold, 'Inter');
  }
  // GlobalFonts.registerFromPath(fontPathRegular, 'Inter'); // Descomente se tiver a regular
} catch (e) {
  console.log("Erro ao carregar fonte:", e);
}

// --- 2. FUNÇÃO PARA TRUNCAR TEXTO COM ... ---
function truncateText(ctx, text, maxWidth, font) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

// --- 3. EFEITO DE VIDRO SUBTIL NO AVATAR ---
function drawGlassCircle(ctx, centerX, centerY, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();
}

// --- 4. HANDLER PRINCIPAL (Vertical, mais alto, foto no topo, nome + ID abaixo) ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Dimensões mais altas (formato portrait / card vertical alto – estilo Apple ID ou perfil moderno)
    const WIDTH = 900;
    const HEIGHT = 1400;
    const MARGIN = 50;
    const CARD_RADIUS = 60;

    // Dados da requisição (apenas foto, nome e username/ID)
    const {
      name = "Yoshikawa",
      username = "@usuario",
      pp = "https://i.imgur.com/Te0cnz2.png"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Carregar imagem de perfil
    let img = null;
    try {
      const response = await fetch(pp);
      const arrayBuffer = await response.arrayBuffer();
      img = await loadImage(Buffer.from(arrayBuffer));
    } catch (e) {
      console.log("Erro ao carregar imagem, usando fallback");
    }

    // Efeito card flutuante com margens
    ctx.translate(MARGIN, MARGIN);
    const W = WIDTH - (MARGIN * 2);
    const H = HEIGHT - (MARGIN * 2);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // Fundo borrado da própria foto
    let bgRect = { x: 0, y: 0, w: W, h: H };
    if (img) {
      const BG_ZOOM = 1.5;
      const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM;
      bgRect = {
        w: img.width * scale,
        h: img.height * scale,
        x: (W - img.width * scale) / 2,
        y: (H - img.height * scale) / 2
      };

      ctx.filter = 'blur(35px)';
      ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, W, H);
    }

    // Overlay gradiente sutil (mais claro no topo para destacar avatar e textos)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // --- LAYOUT VERTICAL ---
    const centerX = W / 2;

    // Avatar grande no topo
    const avatarSize = 420;
    const avatarRadius = avatarSize / 2;
    const avatarY = 120; // Distância do topo

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;

    ctx.beginPath();
    ctx.arc(centerX, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
      ctx.drawImage(img, centerX - avatarRadius, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = '#222222';
      ctx.fill();
    }
    ctx.restore();

    // Borda de vidro sutil no avatar
    drawGlassCircle(ctx, centerX, avatarY + avatarRadius, avatarRadius);

    // --- TEXTOS CENTRALIZADOS ABAIXO DO AVATAR ---
    ctx.textAlign = 'center';

    const textStartY = avatarY + avatarSize + 80;
    const maxTextWidth = W * 0.85; // Largura máxima para truncar (85% do card)

    // Nome principal (grande, bold)
    const nameFont = 'bold 88px Inter, sans-serif';
    const truncatedName = truncateText(ctx, name, maxTextWidth, nameFont);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = nameFont;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillText(truncatedName, centerX, textStartY);
    ctx.shadowBlur = 0;

    // Username / ID (menor, cinza claro)
    const usernameFont = '400 52px Inter, sans-serif';
    const truncatedUsername = truncateText(ctx, username, maxTextWidth, usernameFont); // Também trunca se necessário

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = usernameFont;
    ctx.fillText(truncatedUsername, centerX, textStartY + 100);

    // Finalizar
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração do perfil");
  }
}
