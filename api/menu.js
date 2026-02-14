import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- REGISTRO DE FONTE ---
const fontPath = path.join(__dirname, 'fonts/Inter-Bold.ttf'); 
if (!GlobalFonts.has('Inter')) {
  try {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  } catch (e) {
    console.log('Fonte Inter não encontrada, usando fonte padrão');
  }
}

// --- FUNÇÕES AUXILIARES DE DESENHO ---

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
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size);
  ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.fill();
  ctx.restore();
}

function drawTranslateIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  // Fundo do ícone
  ctx.fillStyle = '#ff99cc';
  ctx.fillRect(-size/2, -size/2, size * 1.5, size);
  
  // Símbolo "A"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("A", 0, 0);
  
  // Símbolo atrás
  ctx.font = `${size * 0.6}px Arial`;
  ctx.globalAlpha = 0.8;
  ctx.fillText("文", size * 0.5, -size * 0.2);
  
  ctx.restore();
}

async function generateImage() {
  try {
    console.log('Iniciando geração da imagem...');
    
    // 1. CONFIGURAÇÃO DO CANVAS
    const W = 1000;
    const H = 650;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bgUrl = "https://yoshikawa-bot.github.io/cache/images/d998aed2.jpg";
    const charUrl = "https://yoshikawa-bot.github.io/cache/images/717371a8.png";
    const logoUrl = "https://yoshikawa-bot.github.io/cache/images/4b8be4b4.png";

    console.log('Carregando imagens...');
    const [bgImage, charImage, logoImage] = await Promise.all([
      loadImage(bgUrl),
      loadImage(charUrl),
      loadImage(logoUrl)
    ]);
    console.log('Imagens carregadas com sucesso!');

    // 2. FUNDO E BASE
    const cardRadius = 50;
    
    // Clip com bordas arredondadas
    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, cardRadius);
    ctx.clip();

    // Desenhar fundo
    const bgScale = Math.max(W / bgImage.width, H / bgImage.height);
    const bgW = bgImage.width * bgScale;
    const bgH = bgImage.height * bgScale;
    const bgX = (W - bgW) / 2;
    const bgY = (H - bgH) / 2;
    ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);

    // 3. CAMADA ESCURA - Garantir contraste
    const gradient = ctx.createLinearGradient(0, 0, W, 0);
    gradient.addColorStop(0, 'rgba(10, 0, 20, 0.98)');
    gradient.addColorStop(0.6, 'rgba(20, 0, 30, 0.92)');
    gradient.addColorStop(1, 'rgba(30, 0, 40, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // 4. PERSONAGEM (REDUZIDA)
    const charScale = 0.45;
    const cW = charImage.width * charScale;
    const cH = charImage.height * charScale;
    const cX = W - cW + 20;
    const cY = H - cH + 30;
    ctx.drawImage(charImage, cX, cY, cW, cH);

    ctx.restore();

    // --- ÁREA DE INTERFACE ---
    const startX = 60;
    let cursorY = 60;

    // 5. CABEÇALHO
    
    // Texto "VERSION 7.0"
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff3399';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Adicionar outline para maior visibilidade
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('VERSION 7.0', startX, cursorY);
    ctx.fillText('VERSION 7.0', startX, cursorY);
    
    cursorY += 25;

    // Logo MAIOR
    const logoTargetH = 120;
    const logoRatio = logoImage.width / logoImage.height;
    const logoTargetW = logoTargetH * logoRatio;
    
    // Adicionar fundo branco atrás do logo para visibilidade
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(startX - 10, cursorY - 5, logoTargetW + 20, logoTargetH + 10);
    
    ctx.drawImage(logoImage, startX, cursorY, logoTargetW, logoTargetH);
    
    cursorY += logoTargetH + 50;

    // 6. TÍTULO "MAIN MENU"
    drawHeart(ctx, startX + 5, cursorY, 18, '#ff3399');
    drawHeart(ctx, startX + 25, cursorY + 8, 14, '#ff66bb');

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('MAIN MENU', startX + 50, cursorY);
    ctx.fillText('MAIN MENU', startX + 50, cursorY);

    cursorY += 50;

    // 7. LISTA DE MENUS
    const menus = [
      "MENU DOWNLOADS",
      "MENU VIP",
      "MENU NETFLIX",
      "MENU BRINCADEIRAS",
      "MENU ADM",
      "INFO BOT"
    ];

    const btnHeight = 45;
    const btnWidth = 360;
    const btnGap = 14;
    const btnColor = 'rgba(100, 50, 130, 0.85)';

    ctx.font = 'bold 19px Arial';
    ctx.textBaseline = 'middle';

    menus.forEach(menuText => {
      // Fundo do botão com borda
      fillRoundedRect(ctx, startX, cursorY, btnWidth, btnHeight, 10, btnColor);
      
      // Borda para destaque
      ctx.strokeStyle = '#ff3399';
      ctx.lineWidth = 2;
      drawRoundedRectPath(ctx, startX, cursorY, btnWidth, btnHeight, 10);
      ctx.stroke();
      
      // Texto do botão com outline
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      ctx.strokeText(menuText, startX + 20, cursorY + (btnHeight / 2));
      ctx.fillText(menuText, startX + 20, cursorY + (btnHeight / 2));

      cursorY += btnHeight + btnGap;
    });

    cursorY += 20;

    // 8. METADADOS
    const infoData = [
      { label: "PERSONAGEM", value: "Yoshikawa" },
      { label: "COMANDOS", value: "343" },
      { label: "CRIADOR", value: "@kawalyansky" },
      { label: "IDIOMA", value: "Português", icon: true },
      { label: "VOZ", value: "Milenna" }
    ];

    const labelX = startX + 5;
    const valueX = startX + 355;
    const lineHeight = 35;

    ctx.font = 'bold 18px Arial';

    infoData.forEach(item => {
      if (item.icon) {
         drawTranslateIcon(ctx, labelX - 25, cursorY + lineHeight/2, 18);
      }

      // Label com outline
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff99dd';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(item.label, labelX, cursorY + lineHeight/2);
      ctx.fillText(item.label, labelX, cursorY + lineHeight/2);

      // Valor com outline
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.strokeText(item.value, valueX, cursorY + lineHeight/2);
      ctx.fillText(item.value, valueX, cursorY + lineHeight/2);
      
      cursorY += lineHeight;
    });

    // 9. BOTÃO EXIT
    ctx.textAlign = 'left';
    
    const exitY = H - 80;
    const exitW = 120;
    const exitH = 45;
    
    fillRoundedRect(ctx, startX, exitY, exitW, exitH, 12, 'rgba(120, 60, 140, 0.9)');
    
    // Borda do botão EXIT
    ctx.strokeStyle = '#ff3399';
    ctx.lineWidth = 2;
    drawRoundedRectPath(ctx, startX, exitY, exitW, exitH, 12);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.strokeText("EXIT", startX + (exitW/2), exitY + (exitH/2));
    ctx.fillText("EXIT", startX + (exitW/2), exitY + (exitH/2));

    // --- SALVAR IMAGEM ---
    console.log('Gerando arquivo PNG...');
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, 'yoshikawa-menu-output.png');
    writeFileSync(outputPath, buffer);
    
    console.log('✅ Imagem gerada com sucesso!');
    console.log(`📁 Arquivo salvo em: ${outputPath}`);
    
    return buffer;

  } catch (error) {
    console.error("❌ Erro ao gerar imagem:", error);
    throw error;
  }
}

// Executar
generateImage().catch(console.error);
