import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- REGISTRO DE FONTE ---
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

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size; 
  ctx.moveTo(0, s * 0.3); 
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s * 1, s * 0.2, 0, s * 1);
  ctx.bezierCurveTo(s * 1, s * 0.2, s * 0.5, -s * 0.3, 0, s * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawLangIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ecaebd';
  ctx.lineWidth = 2;
  ctx.font = `bold ${size}px Inter`;
  ctx.fillStyle = '#ecaebd';
  ctx.fillText("A", 0, size);
  ctx.font = `${size * 0.6}px Inter`;
  ctx.fillText("あ", size * 0.6, size * 0.6);
  ctx.restore();
}

export default async function handler(req, res) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Content-Type", "image/png");
  }

  try {
    // 1. Configuração do Canvas com padding maior
    const W = 1200;
    const H = 780;
    const PADDING = 60; // Padding aumentado
    const BORDER_RADIUS = 80; // Bordas muito mais arredondadas
    
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // --- CARREGAMENTO DE IMAGENS ---
    const bgUrl = "https://yoshikawa-bot.github.io/cache/images/d998aed2.jpg";
    const charUrl = "https://yoshikawa-bot.github.io/cache/images/717371a8.png";
    const logoUrl = "https://yoshikawa-bot.github.io/cache/images/4b8be4b4.png";

    const [bgImage, charImage, logoImage] = await Promise.all([
      loadImage(bgUrl),
      loadImage(charUrl),
      loadImage(logoUrl)
    ]);

    // 2. Aplicar clip arredondado primeiro (para tudo ficar dentro das bordas)
    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, BORDER_RADIUS);
    ctx.clip();

    // 3. Fundo (Background)
    const bgScale = Math.max(W / bgImage.width, H / bgImage.height);
    const bgW = bgImage.width * bgScale;
    const bgH = bgImage.height * bgScale;
    ctx.drawImage(bgImage, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);

    // 4. Overlay Escuro (menos opaco para deixar elementos visíveis)
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, 'rgba(20, 0, 20, 0.65)');
    gradient.addColorStop(0.5, 'rgba(30, 0, 40, 0.70)');
    gradient.addColorStop(1, 'rgba(20, 0, 30, 0.75)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Vignette suave
    const radialGrad = ctx.createRadialGradient(W/2, H/2, H/3, W/2, H/2, W);
    radialGrad.addColorStop(0, 'rgba(0,0,0,0)');
    radialGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, W, H);

    // 5. Personagem (Lado Direito) - ajustado para não ser cortado
    const charScale = 1.0;
    const charW = charImage.width * charScale;
    const charH = charImage.height * charScale;
    const charX = W - charW + 60;
    const charY = H - charH + 40;
    ctx.drawImage(charImage, charX, charY, charW, charH);

    ctx.restore(); // Fim do clip

    // 6. Interface - Lado Esquerdo com padding aumentado
    const marginLeft = 80 + PADDING;

    // --- Header / Logo ---
    ctx.fillStyle = '#ff66aa';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('VERSION 7.0', marginLeft, 85 + PADDING);

    // Logo
    const logoScale = 0.8;
    const logoW = logoImage.width * logoScale;
    const logoH = logoImage.height * logoScale;
    ctx.drawImage(logoImage, marginLeft - 10, 95 + PADDING, logoW, logoH);

    // "MAIN MENU" com corações
    const menuStartY = 240 + PADDING;
    
    drawHeart(ctx, marginLeft - 25, menuStartY - 15, 12, '#ffccdd');
    drawHeart(ctx, marginLeft - 10, menuStartY - 5, 8, '#ffccdd');

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter';
    ctx.fillText('MAIN MENU', marginLeft, menuStartY);

    // --- Lista de Botões ---
    const buttons = [
      "MENU DOWNLOADS",
      "MENU VIP",
      "MENU NETFLIX",
      "MENU BRINCADEIRAS",
      "MENU ADM",
      "INFO BOT"
    ];

    const btnH = 42;
    const btnW = 380;
    const btnGap = 12;
    let currentY = menuStartY + 30;

    ctx.font = 'bold 18px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    buttons.forEach((text) => {
      // Fundo do botão com sombra
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      fillRoundedRect(ctx, marginLeft, currentY, btnW, btnH, 10, 'rgba(80, 50, 90, 0.6)');
      ctx.restore();
      
      // Texto do botão com sombra para melhor legibilidade
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#ebd5eb';
      ctx.fillText(text, marginLeft + 20, currentY + btnH/2);
      ctx.restore();
      
      currentY += btnH + btnGap;
    });

    // --- Seção de Informações ---
    const infoStartY = currentY + 20;
    const infoLineH = 32;
    const infoLabelX = marginLeft;
    const infoValueX = marginLeft + 370;

    const infoData = [
      { label: "PERSONAGEM", value: "Yoshikawa" },
      { label: "COMANDOS", value: "343" },
      { label: "CRIADOR", value: "@kawalyansky" },
      { label: "IDIOMA", value: "Português", icon: true },
      { label: "VOZ", value: "Milenna" }
    ];

    infoData.forEach((item, index) => {
      const yPos = infoStartY + (index * infoLineH);

      // Label
      ctx.font = 'bold 16px Inter';
      ctx.fillStyle = '#eebbdd';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      if (item.icon) {
        drawLangIcon(ctx, infoLabelX - 30, yPos - 5, 14);
      }
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.fillText(item.label, infoLabelX, yPos);
      ctx.restore();

      // Valor
      ctx.textAlign = 'right';
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.value, infoValueX, yPos);
      ctx.restore();
    });

    // --- Botão EXIT ---
    const exitY = H - 80 - PADDING;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    fillRoundedRect(ctx, marginLeft, exitY, 120, 45, 15, 'rgba(80, 50, 90, 0.6)');
    ctx.restore();
    
    ctx.fillStyle = '#ebd5eb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px Inter';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText("EXIT", marginLeft + 60, exitY + 22);
    ctx.restore();

    // 7. Output
    const buffer = await canvas.encode('png');
    
    if (res && typeof res.send === 'function') {
      res.send(buffer);
    } else {
      return buffer;
    }

  } catch (e) {
    console.error("Erro ao gerar canvas:", e);
    if (res && typeof res.status === 'function') res.status(500).send("Erro interno");
  }
        }
