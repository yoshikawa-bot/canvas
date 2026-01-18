import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURAÇÃO DE FONTES ---
// Certifique-se de ter uma fonte Sans-Serif moderna (Inter, Roboto ou SF Pro)
try {
  // Ajuste os caminhos conforme sua pasta
  const fontRegular = path.join(__dirname, '../fonts/Inter-Regular.ttf'); 
  const fontBold = path.join(__dirname, '../fonts/Inter-Bold.ttf');
  const fontMedium = path.join(__dirname, '../fonts/Inter-Medium.ttf');

  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontBold, 'Inter-Bold');
    GlobalFonts.registerFromPath(fontRegular, 'Inter-Regular');
    GlobalFonts.registerFromPath(fontMedium, 'Inter-Medium');
  }
} catch (e) {
  console.log("Aviso: Fontes não carregadas, usando padrão do sistema.");
}

// --- 2. FUNÇÕES AUXILIARES DE DESENHO ---

// Desenha um retângulo arredondado (Rounded Rect)
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
  ctx.font = '18px Inter-Medium';
  const padding = 20;
  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + (padding * 2);
  const pillHeight = 36;
  const radius = 18;

  ctx.save();
  // Fundo da pílula
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, x, y, pillWidth, pillHeight, radius);
  ctx.fill();

  // Borda sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Texto
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, x + padding, y + 24);
  ctx.restore();

  return pillWidth + 10; // Retorna largura para posicionar o próximo
}

// --- 3. HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Dados de entrada
    const {
      name = "Pink Sky",
      username = "User ID", // O ID será usado como uma das tags
      bg = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg", // Exemplo padrão
      pp = "https://i.pinimg.com/736x/d6/d3/9f/d6d39f60db35a815a0c8b6b060f7813a.jpg"
    } = req.method === "POST" ? req.body : req.query;

    // Dimensões do Canvas (Similar à imagem: quase quadrado)
    const W = 1000;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. CARREGAR IMAGENS
    // Usamos a foto de perfil como background se não houver um bg específico, para combinar cores
    const imgBg = await loadImage(pp).catch(() => null); 
    const imgAvatar = await loadImage(pp).catch(() => null);

    // 2. FUNDO (BACKGROUND) - Efeito Blur Intenso
    if (imgBg) {
      // Scale para garantir que cubra tudo sem bordas brancas no blur
      const scale = Math.max(W / imgBg.width, H / imgBg.height) * 1.2;
      const x = (W - (imgBg.width * scale)) / 2;
      const y = (H - (imgBg.height * scale)) / 2;
      
      ctx.save();
      ctx.filter = 'blur(60px) brightness(0.8) saturate(1.2)'; // Blur pesado e ajuste de cor
      ctx.drawImage(imgBg, x, y, imgBg.width * scale, imgBg.height * scale);
      ctx.restore();
    } else {
      // Fallback
      ctx.fillStyle = '#2b1020';
      ctx.fillRect(0, 0, W, H);
    }

    // --- GEOMETRIA DO LAYOUT ---
    const CARD_MARGIN = 50;
    const GLASS_H = 550; // Altura do vidro inferior
    const GLASS_Y = H - GLASS_H - 50; // Começa a 550px do fundo
    const GLASS_W = W - (CARD_MARGIN * 2);
    const GLASS_RADIUS = 60;

    const AVATAR_SIZE = 220;
    const AVATAR_RADIUS = AVATAR_SIZE / 2;
    // O Avatar fica "montado" na linha superior do vidro.
    // Centro do avatar = (X: 180, Y: GLASS_Y)
    const AVATAR_CX = CARD_MARGIN + 120; 
    const AVATAR_CY = GLASS_Y; // Exatamente na linha da borda

    // 3. CARTÃO DE VIDRO (CONTAINER INFERIOR)
    ctx.save();
    
    // Sombra suave atrás do vidro para dar profundidade
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Desenhar forma do vidro
    drawRoundedRect(ctx, CARD_MARGIN, GLASS_Y, GLASS_W, GLASS_H, GLASS_RADIUS);
    
    // Preenchimento Gradiente (Vidro)
    const grad = ctx.createLinearGradient(CARD_MARGIN, GLASS_Y, CARD_MARGIN, GLASS_Y + GLASS_H);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Topo levemente branco
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)'); // Fundo mais transparente
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset sombra para não afetar o resto

    // Borda do vidro (Stroke brilhante)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();
    
    // Linha de brilho extra no topo (opcional, para realismo)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CARD_MARGIN + GLASS_RADIUS, GLASS_Y);
    ctx.lineTo(CARD_MARGIN + GLASS_W - GLASS_RADIUS, GLASS_Y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Fim do contexto do vidro

    // 4. AVATAR (CÍRCULO)
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

    // Borda sutil ao redor do avatar (para separar do fundo)
    ctx.beginPath();
    ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. TEXTOS
    const TEXT_START_X = CARD_MARGIN + 60; // Margem interna esquerda
    const CONTENT_START_Y = AVATAR_CY + AVATAR_RADIUS + 40; // Começa abaixo do avatar

    // Nome (Grande)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '64px Inter-Bold'; // Fonte grande
    ctx.textBaseline = 'top';
    ctx.fillText(name, TEXT_START_X, CONTENT_START_Y);

    // Tags / ID (Pílulas)
    let tagX = TEXT_START_X;
    const tagY = CONTENT_START_Y + 85;
    
    // Tag 1: Cargo ou Estático (ex: "Member")
    tagX += drawGlassPill(ctx, 'User', tagX, tagY);
    
    // Tag 2: O ID/Username do usuário
    drawGlassPill(ctx, username, tagX, tagY);

    // Bio Falsa (Para manter o visual estético da imagem, já que o usuário não envia bio)
    // Se quiser remover, apenas delete este bloco.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '28px Inter-Regular';
    const bioText = "Welcome to my profile card. This is an automated visualization of my account status and ID.";
    
    // Quebra de linha simples para bio
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
    const BUTTON_Y = GLASS_Y + GLASS_H - 130; // Perto do fundo do vidro
    const BTN_HEIGHT = 80;

    // Botão Grande "+ Follow"
    const btnFollowWidth = 350;
    ctx.save();
    
    // Fundo do botão (gradiente escuro/marrom como na imagem ou semitransparente)
    const btnGrad = ctx.createLinearGradient(TEXT_START_X, BUTTON_Y, TEXT_START_X, BUTTON_Y + BTN_HEIGHT);
    btnGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    btnGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    
    ctx.fillStyle = btnGrad;
    drawRoundedRect(ctx, TEXT_START_X, BUTTON_Y, btnFollowWidth, BTN_HEIGHT, 40);
    ctx.fill();
    
    // Borda fina botão
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // Texto "+ Follow"
    ctx.fillStyle = '#FFF';
    ctx.font = '32px Inter-Medium';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+  Follow', TEXT_START_X + (btnFollowWidth/2), BUTTON_Y + (BTN_HEIGHT/2));
    ctx.restore();

    // Botões Circulares (Mail e Bell)
    // Vamos desenhar apenas os círculos com ícones simples (desenho geométrico) para não depender de assets
    const iconSize = 80;
    const iconGap = 20;
    let iconX = TEXT_START_X + btnFollowWidth + 30;

    function drawCircleBtn(x, symbol) {
      // Círculo Fundo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x + iconSize/2, BUTTON_Y + iconSize/2, iconSize/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Ícone (Texto simples)
      ctx.fillStyle = '#FFF';
      ctx.font = '36px Inter-Regular'; // Usando emoji como fallback visual rápido
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, x + iconSize/2, BUTTON_Y + iconSize/2 + 2);
    }

    // Desenhar ícone de Email e Sino usando caracteres unicode ou formas
    // Nota: Em canvas node, emojis podem variar. Se preferir formas:
    // Email
    drawCircleBtn(iconX, '✉'); 
    // Sino
    drawCircleBtn(iconX + iconSize + iconGap, '🔔');

    // 7. OUTPUT
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao gerar imagem");
  }
}
