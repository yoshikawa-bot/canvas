import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- REGISTRO DE FONTE ---
// Certifique-se de que o arquivo da fonte existe neste caminho
const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf'); 
if (!GlobalFonts.has('Inter')) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

// --- FUNÇÕES AUXILIARES DE DESENHO ---

// Desenha retângulo arredondado (para clip ou preenchimento)
function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

// Preenche retângulo arredondado
function fillRoundedRect(ctx, x, y, width, height, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

// Desenha corações decorativos
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

// Desenha o ícone de tradução (A/文)
function drawTranslateIcon(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ff99cc'; // Cor rosa do ícone
    
    // Símbolo "A"
    ctx.font = `bold ${size}px Inter`;
    ctx.fillText("A", 0, 0);
    
    // Símbolo Chinês/Japonês pequeno atrás
    ctx.font = `${size * 0.7}px Inter`;
    ctx.globalAlpha = 0.7;
    ctx.fillText("文", size * 0.6, -size * 0.3);
    
    ctx.restore();
}

export default async function handler(req, res) {
  // Configuração básica de resposta HTTP (se usado como API)
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Content-Type", "image/png");
  }

  try {
    // 1. CONFIGURAÇÃO DO CANVAS
    const W = 1000; // Largura ajustada para a proporção da imagem
    const H = 650;  // Altura ajustada
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // URLs das imagens (mantendo as suas)
    const bgUrl = "https://yoshikawa-bot.github.io/cache/images/d998aed2.jpg";
    const charUrl = "https://yoshikawa-bot.github.io/cache/images/717371a8.png";
    const logoUrl = "https://yoshikawa-bot.github.io/cache/images/4b8be4b4.png";

    // Carregamento paralelo das imagens
    const [bgImage, charImage, logoImage] = await Promise.all([
      loadImage(bgUrl),
      loadImage(charUrl),
      loadImage(logoUrl)
    ]);

    // 2. FUNDO E BASE (Bordas Arredondadas Globais)
    const cardRadius = 50;
    
    // Criar o formato do cartão (Clip)
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, cardRadius);
    ctx.clip();

    // Desenhar Imagem de Fundo (Cobrindo tudo)
    // Calculamos o aspect ratio para "cover"
    const bgScale = Math.max(W / bgImage.width, H / bgImage.height);
    const bgW = bgImage.width * bgScale;
    const bgH = bgImage.height * bgScale;
    const bgX = (W - bgW) / 2;
    const bgY = (H - bgH) / 2;
    ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);

    // 3. CAMADA ESCURA (OVERLAY)
    // Essencial para o texto branco aparecer, como na referência
    const gradient = ctx.createLinearGradient(0, 0, W, 0);
    gradient.addColorStop(0, 'rgba(20, 0, 30, 0.95)'); // Esquerda bem escura
    gradient.addColorStop(0.5, 'rgba(30, 0, 40, 0.85)'); // Meio
    gradient.addColorStop(1, 'rgba(40, 0, 50, 0.4)');  // Direita mais transparente para a personagem
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // 4. PERSONAGEM (Lado Direito)
    // Ajuste fino da posição
    const charScale = 0.95; // Escala da personagem
    const cW = charImage.width * charScale;
    const cH = charImage.height * charScale;
    // Posiciona ela ancorada no canto inferior direito
    const cX = W - cW + 80; // +80 joga um pouco pra direita (corta o excesso)
    const cY = H - cH + 50; // +50 joga um pouco pra baixo
    ctx.drawImage(charImage, cX, cY, cW, cH);

    // --- ÁREA DE INTERFACE (LADO ESQUERDO) ---
    const startX = 60; // Margem esquerda
    let cursorY = 60;  // Cursor vertical

    // 5. CABEÇALHO (Versão e Logo)
    
    // Texto "VERSION 7.0"
    ctx.font = 'bold 12px Inter';
    ctx.fillStyle = '#ff66aa'; // Rosa neon
    ctx.fillText('VERSION 7.0', startX, cursorY);
    
    cursorY += 15;

    // Logo (Imagem)
    const logoTargetH = 70; // Altura desejada para o logo
    const logoRatio = logoImage.width / logoImage.height;
    const logoTargetW = logoTargetH * logoRatio;
    
    // Filtro para pintar o logo de rosa/branco se necessário, 
    // mas vamos desenhar normal assumindo que a imagem já tem cor.
    // Dica: Se o logo for preto, use ctx.globalCompositeOperation = 'source-in' para colorir.
    ctx.drawImage(logoImage, startX - 5, cursorY, logoTargetW, logoTargetH);
    
    cursorY += logoTargetH + 40; // Espaço após o logo

    // 6. TÍTULO "MAIN MENU"
    // Desenha corações decorativos antes do texto
    drawHeart(ctx, startX, cursorY - 5, 14, '#ffccdd');
    drawHeart(ctx, startX + 18, cursorY + 5, 10, '#ffccdd');

    ctx.font = '900 24px Inter'; // Extra Bold
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MAIN MENU', startX + 40, cursorY + 10);

    cursorY += 40; // Espaço para começar os botões

    // 7. LISTA DE MENUS (Botões)
    const menus = [
      "MENU DOWNLOADS",
      "MENU VIP",
      "MENU NETFLIX",
      "MENU BRINCADEIRAS",
      "MENU ADM",
      "INFO BOT"
    ];

    const btnHeight = 38;
    const btnWidth = 320;
    const btnGap = 10;
    const btnColor = 'rgba(70, 40, 80, 0.6)'; // Roxo translúcido

    ctx.font = 'bold 15px Inter';
    ctx.textBaseline = 'middle'; // Ajuda a centralizar texto no botão

    menus.forEach(menuText => {
      // Fundo do botão
      fillRoundedRect(ctx, startX, cursorY, btnWidth, btnHeight, 10, btnColor);
      
      // Texto do botão
      ctx.fillStyle = '#ebd5eb'; // Lilás bem claro
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(menuText, startX + 15, cursorY + (btnHeight / 2) + 1);
      ctx.shadowBlur = 0; // Reseta sombra

      cursorY += btnHeight + btnGap;
    });

    cursorY += 10; // Espaço extra antes das informações

    // 8. METADADOS (Info List)
    const infoData = [
      { label: "PERSONAGEM", value: "Yoshikawa" },
      { label: "COMANDOS", value: "343" },
      { label: "CRIADOR", value: "@kawalyansky" },
      { label: "IDIOMA", value: "Português", icon: true },
      { label: "VOZ", value: "Milenna" }
    ];

    const labelX = startX;
    const valueX = startX + 320; // Alinhado à direita dos botões
    const lineHeight = 28;

    ctx.font = 'bold 14px Inter';

    infoData.forEach(item => {
      // Ícone especial para idioma
      if (item.icon) {
         drawTranslateIcon(ctx, labelX - 25, cursorY + lineHeight/2 + 4, 14);
      }

      // Label (Esquerda)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#eebbdd'; // Rosa claro
      ctx.fillText(item.label, labelX, cursorY + lineHeight/2);

      // Valor (Direita)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff'; // Branco
      ctx.fillText(item.value, valueX, cursorY + lineHeight/2);
      
      cursorY += lineHeight;
    });

    // 9. BOTÃO EXIT (Rodapé Esquerdo)
    // Reinicia alinhamento
    ctx.textAlign = 'left';
    
    // Posição absoluta lá embaixo
    const exitY = H - 70;
    const exitW = 100;
    const exitH = 35;
    
    fillRoundedRect(ctx, startX, exitY, exitW, exitH, 12, 'rgba(80, 50, 90, 0.8)');
    
    ctx.fillStyle = '#ebd5eb';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Inter';
    ctx.fillText("EXIT", startX + (exitW/2), exitY + (exitH/2) + 1);

    // --- FINALIZAÇÃO ---
    const buffer = await canvas.encode('png');

    if (res && typeof res.send === 'function') {
      res.send(buffer);
    } else {
      return buffer;
    }

  } catch (error) {
    console.error("Erro no Canvas:", error);
    if (res) res.status(500).send("Erro ao gerar imagem");
  }
}
