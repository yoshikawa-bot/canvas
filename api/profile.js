import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registra a fonte (Inter ou similar do sistema iOS)
try {
  const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
  const fontRegular = path.join(__dirname, '../fonts/Inter-Regular.ttf');
  
  // Tenta registrar, se falhar usa Arial como fallback
  if (!GlobalFonts.has('Inter-Bold')) GlobalFonts.registerFromPath(fontPath, 'Inter-Bold');
  if (!GlobalFonts.has('Inter-Regular')) GlobalFonts.registerFromPath(fontRegular, 'Inter-Regular');
} catch (e) { }

const fontBold = 'Inter-Bold, "Segoe UI", Roboto, sans-serif';
const fontReg = 'Inter-Regular, "Segoe UI", Roboto, sans-serif';

// Função auxiliar para desenhar Retângulos Arredondados
function roundRect(ctx, x, y, width, height, radius) {
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

// Desenha o ícone de seta (Chevron) >
function drawChevron(ctx, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      name = "Usuário",
      username = "user@id",
      rank = "Membro", // Subtítulo (ex: Adulto na ref, aqui será o Rank/Nivel)
      pp = "https://i.imgur.com/Te0cnz2.png" // Fallback image
    } = req.method === "POST" ? req.body : req.query;

    const W = 1080;
    const H = 720; // Formato retangular estilo card mobile
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Fundo (Estilo iOS Settings - Cinza Claro)
    ctx.fillStyle = '#F2F2F7';
    ctx.fillRect(0, 0, W, H);

    // 2. Avatar Circular (Centralizado no topo)
    const avatarY = 100;
    const avatarSize = 220;
    const centerX = W / 2;

    try {
      const img = await loadImage(pp);
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, centerX - avatarSize / 2, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch (e) {
      // Fallback se imagem falhar
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Nome do Usuário
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = `bold 55px ${fontBold}`;
    ctx.fillText(name, centerX, avatarY + avatarSize + 70);

    // 4. Subtítulo (Rank/Nível - Texto cinza pequeno)
    ctx.fillStyle = '#8E8E93';
    ctx.font = `400 32px ${fontReg}`;
    ctx.fillText(rank, centerX, avatarY + avatarSize + 115);

    // 5. Card "ID Yoshikawa" (Estilo lista iOS)
    const cardW = 900;
    const cardH = 160;
    const cardX = (W - cardW) / 2;
    const cardY = avatarY + avatarSize + 160;

    // Sombra suave
    ctx.shadowColor = "rgba(0,0,0,0.05)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Fundo do Card Branco
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.shadowColor = "transparent"; // Reset sombra

    // Ícone Quadrado Cinza (Esquerda do card)
    const iconSize = 100;
    const iconMargin = 30;
    const iconX = cardX + iconMargin;
    const iconY = cardY + (cardH - iconSize) / 2;
    
    ctx.fillStyle = '#E5E5EA'; // Cinza do ícone
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 18);
    ctx.fill();

    // Símbolo dentro do ícone (Um "ID" ou logo simples)
    ctx.fillStyle = '#8E8E93';
    ctx.font = `bold 40px ${fontBold}`;
    ctx.textBaseline = 'middle';
    ctx.fillText("ID", iconX + iconSize/2, iconY + iconSize/2 + 2);
    ctx.textBaseline = 'alphabetic'; // Reset

    // Texto do Card
    ctx.textAlign = 'left';
    
    // Título "ID Yoshikawa"
    ctx.fillStyle = '#000000';
    ctx.font = `400 38px ${fontReg}`;
    ctx.fillText("ID Yoshikawa", iconX + iconSize + 30, cardY + 65);

    // Subtítulo (Email/JID)
    ctx.fillStyle = '#8E8E93';
    ctx.font = `400 30px ${fontReg}`;
    // Trunca o JID se for muito longo
    let displayJid = username;
    if (displayJid.length > 35) displayJid = displayJid.substring(0, 32) + "...";
    ctx.fillText(displayJid, iconX + iconSize + 30, cardY + 115);

    // Seta (Chevron) na direita
    const arrowX = cardX + cardW - 50;
    const arrowY = cardY + cardH / 2;
    drawChevron(ctx, arrowX, arrowY, 12, '#C7C7CC');

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração do perfil");
  }
}

