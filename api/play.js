
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registrar fonte Inter
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) { 
  console.log('Fonte Inter não encontrada, usando fallback');
}

// Glassmorphism
function drawGlassRect(ctx, x, y, width, height, radius, bgImg, bgRect) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  
  if (bgImg) {
    ctx.filter = 'blur(30px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export default async function handler(req, res) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Content-Type", "image/png");
  }

  try {
    // Canvas landscape
    const W = 1920;
    const H = 1080;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // URLs
    const bgUrl = "https://yoshikawa-bot.github.io/cache/images/d998aed2.jpg";
    const charUrl = "https://yoshikawa-bot.github.io/cache/images/717371a8.png";
    const logoUrl = "https://yoshikawa-bot.github.io/cache/images/4b8be4b4.png";

    const [bgImage, charImage, logoImage] = await Promise.all([
      loadImage(bgUrl),
      loadImage(charUrl),
      loadImage(logoUrl)
    ]);

    // === FUNDO (sem efeitos, apenas fit) ===
    const bgScale = Math.max(W / bgImage.width, H / bgImage.height);
    const bgW = bgImage.width * bgScale;
    const bgH = bgImage.height * bgScale;
    const bgX = (W - bgW) / 2;
    const bgY = (H - bgH) / 2;
    
    const bgRect = { x: bgX, y: bgY, w: bgW, h: bgH };
    ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);

    // === PERSONAGEM (direita, sem efeitos) ===
    const charScale = 0.75;
    const charW = charImage.width * charScale;
    const charH = charImage.height * charScale;
    const charX = W - charW + 200;
    const charY = H - charH + 50;
    ctx.drawImage(charImage, charX, charY, charW, charH);

    // === MENU (esquerda) ===
    const menuX = 120;
    const menuY = 120;
    const menuW = 550;
    
    // Logo no topo
    const logoScale = 0.35;
    const logoW = logoImage.width * logoScale;
    const logoH = logoImage.height * logoScale;
    ctx.drawImage(logoImage, menuX, menuY, logoW, logoH);
    
    let currentY = menuY + logoH + 80;

    // Título
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAIN MENU', menuX, currentY);
    currentY += 80;

    // Botões
    const buttons = [
      "DOWNLOADS",
      "VIP",
      "NETFLIX",
      "BRINCADEIRAS",
      "ADM",
      "INFO"
    ];

    const btnH = 65;
    const btnGap = 20;

    buttons.forEach((text) => {
      drawGlassRect(ctx, menuX, currentY, menuW, btnH, 16, bgImage, bgRect);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, menuX + 30, currentY + btnH / 2);
      
      currentY += btnH + btnGap;
    });

    currentY += 40;

    // Info
    const infoData = [
      { label: "PERSONAGEM", value: "Yoshikawa" },
      { label: "COMANDOS", value: "343" },
      { label: "CRIADOR", value: "@kawalyansky" }
    ];

    ctx.font = '500 22px Inter, sans-serif';
    
    infoData.forEach((item) => {
      ctx.fillStyle = '#ff99cc';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, menuX, currentY);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'right';
      ctx.fillText(item.value, menuX + menuW, currentY);
      
      currentY += 45;
    });

    // Exit
    const exitY = H - 150;
    drawGlassRect(ctx, menuX, exitY, 180, 65, 16, bgImage, bgRect);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("EXIT", menuX + 90, exitY + 32);

    // Cantos arredondados
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 120);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const buffer = await canvas.encode('png');
    
    if (res && typeof res.send === 'function') {
      res.send(buffer);
    } else {
      return buffer;
    }

  } catch (e) {
    console.error("Erro:", e);
    if (res && typeof res.status === 'function') {
      res.status(500).send("Erro");
    }
  }
}
