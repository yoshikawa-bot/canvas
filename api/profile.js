import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CARREGAMENTO DE FONTES ---
try {
  // Use caminhos absolutos para garantir que funcione em qualquer ambiente
  const fontBoldPath = path.resolve(__dirname, '../fonts/Inter-Bold.ttf');
  const fontRegularPath = path.resolve(__dirname, '../fonts/Inter-Regular.ttf'); 
  
  // Verifica e registra as fontes necessárias
  if (!GlobalFonts.has('Inter-Bold')) {
      GlobalFonts.registerFromPath(fontBoldPath, 'Inter-Bold');
  }
  if (!GlobalFonts.has('Inter-Regular')) {
      try { GlobalFonts.registerFromPath(fontRegularPath, 'Inter-Regular'); } catch(e) { console.log('Inter-Regular não encontrada, usando fallback'); }
  }
} catch (e) { 
  console.error("Erro crítico no carregamento de fontes:", e);
  // O código continuará, mas usará a fonte padrão do sistema, o que pode alterar o visual.
}

// --- 2. FUNÇÕES AUXILIARES ---

// Função para desenhar texto com quebra de linha automática
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    const maxLines = 2; // Permite até 2 linhas para o nome

    ctx.textAlign = 'left'; // Alinhamento à esquerda para este layout
    
    // Verifica se cabe tudo em uma linha
    if (ctx.measureText(text).width <= maxWidth) {
         ctx.fillText(text, x, y);
         return y + lineHeight; // Retorna a próxima posição Y disponível
    }

    let currentY = y;
    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            if (lineCount >= maxLines - 1) {
                // Se exceder o limite de linhas, adiciona reticências e para
                line = line.trim();
                ctx.fillText(line + "...", x, currentY);
                return currentY + lineHeight;
            }
            
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
            lineCount++;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
}

// Função para desenhar um ícone de nuvem simples
function drawCloudIcon(ctx, x, y, width, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();

    const height = width * 0.6;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Desenhando a nuvem usando múltiplos arcos sobrepostos
    // Círculo esquerdo
    ctx.arc(centerX - width * 0.25, centerY + height * 0.1, height * 0.35, Math.PI * 0.5, Math.PI * 1.5);
    // Círculo superior esquerdo
    ctx.arc(centerX - width * 0.1, centerY - height * 0.15, height * 0.4, Math.PI * 1, Math.PI * 1.85);
    // Círculo superior direito (o maior)
    ctx.arc(centerX + width * 0.2, centerY - height * 0.05, height * 0.45, Math.PI * 1.3, Math.PI * 0.1);
    // Círculo direito
    ctx.arc(centerX + width * 0.35, centerY + height * 0.2, height * 0.25, Math.PI * 1.7, Math.PI * 0.5);
    
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// --- 3. HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONFIGURAÇÃO DE LAYOUT HORIZONTAL ---
    const W = 1100;
    const H = 500; 
    
    // Dados de entrada
    const {
      name = "Dawn Ramirez (Eu) Nome Longo Teste",
      username = "yoshikawa_lid_123", // O "lid" do usuário
      pp = "https://i.imgur.com/Te0cnz2.png"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Fundo Clean (Branco)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // --- CARREGAR IMAGEM ---
    let img = null;
    try {
        const response = await fetch(pp);
        const arrayBuffer = await response.arrayBuffer();
        img = await loadImage(Buffer.from(arrayBuffer));
    } catch (e) {
        console.log("Usando fallback de imagem devido a erro no fetch");
    }

    const contentMarginX = 80; // Margem esquerda geral
    const centerY = H / 2;
    
    // --- 2. AVATAR (Esquerda) ---
    const avatarSize = 240;
    const avatarX = contentMarginX + avatarSize / 2;
    
    ctx.save();
    ctx.beginPath();
    // Círculo perfeito
    ctx.arc(avatarX, centerY, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    
    if (img) {
        ctx.drawImage(img, avatarX - avatarSize/2, centerY - avatarSize/2, avatarSize, avatarSize);
    } else {
        ctx.fillStyle = '#E5E5EA'; // Placeholder cinza
        ctx.fillRect(avatarX - avatarSize/2, centerY - avatarSize/2, avatarSize, avatarSize);
    }
    ctx.restore();

    // --- 3. ÁREA DE TEXTO (Direita do Avatar) ---
    
    const textStartX = avatarX + avatarSize / 2 + 50; // Início do texto
    const textMaxWidth = W - textStartX - contentMarginX; // Espaço disponível para texto

    let cursorY = centerY - 60; // Posição Y inicial para começar a desenhar os textos

    // NOME (Grande, Bold)
    ctx.fillStyle = '#000000';
    // Tenta usar a Bold, fallback para sans-serif padrão
    ctx.font = GlobalFonts.has('Inter-Bold') ? 'bold 70px Inter-Bold' : 'bold 70px sans-serif';
    
    // Usa a função de quebra de linha e atualiza a posição Y do cursor
    cursorY = drawWrappedText(ctx, name, textStartX, cursorY, textMaxWidth, 80);

    // SUBTÍTULO (Ex: "Adulto")
    ctx.fillStyle = '#8E8E93'; // Cinza estilo iOS
    ctx.font = GlobalFonts.has('Inter-Regular') ? '500 36px Inter-Regular' : '500 36px sans-serif';
    cursorY -= 10; // Pequeno ajuste fino no espaçamento
    ctx.fillText("Adulto", textStartX, cursorY);
    
    // --- 4. BOTÃO "ID YOSHIKAWA" (Abaixo do texto) ---

    cursorY += 50; // Espaço entre o subtítulo e o botão

    const boxHeight = 130;
    // Largura dinâmica: ocupa o espaço restante ou um tamanho fixo, o que for menor.
    const boxWidth = Math.min(textMaxWidth + 20, 600); 
    const boxRadius = 25;

    // Fundo do Botão (Cinza Claro Arredondado)
    ctx.fillStyle = '#F2F2F7'; 
    ctx.beginPath();
    ctx.roundRect(textStartX - 20, cursorY, boxWidth, boxHeight, boxRadius);
    ctx.fill();

    // ÍCONE DE NUVEM (Azul)
    const iconSize = 70;
    const iconMarginLeft = 30;
    // Centraliza o ícone verticalmente dentro da caixa
    const iconYPos = cursorY + (boxHeight - iconSize * 0.6) / 2 - 5; 
    
    drawCloudIcon(ctx, textStartX + iconMarginLeft - 20, iconYPos, iconSize, '#007AFF'); // Azul iOS

    // TEXTOS DENTRO DO BOTÃO
    ctx.textAlign = 'left';
    const buttonTextX = textStartX + iconMarginLeft + iconSize + 10;
    const buttonTextCenterY = cursorY + boxHeight / 2;

    // Título: ID Yoshikawa
    ctx.fillStyle = '#000000';
    ctx.font = GlobalFonts.has('Inter-Bold') ? 'bold 38px Inter-Bold' : 'bold 38px sans-serif';
    ctx.fillText("ID Yoshikawa", buttonTextX, buttonTextCenterY - 10);

    // Subtítulo: lid (username)
    ctx.fillStyle = '#8E8E93'; // Cinza secundário
    ctx.font = GlobalFonts.has('Inter-Regular') ? '400 30px Inter-Regular' : '400 30px sans-serif';
    
    // Corta o LID se for muito longo
    let displayLid = username;
    const maxLidChars = 25;
    if (displayLid.length > maxLidChars) displayLid = displayLid.substring(0, maxLidChars) + "...";
    
    ctx.fillText(displayLid, buttonTextX, buttonTextCenterY + 28);

    // --- FINALIZAR ---
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    // Cache opcional para melhor performance em produção
    // res.setHeader('Cache-Control', 'public, s-maxage=31536000, max-age=31536000');
    res.send(buffer);

  } catch (e) {
    console.error("Erro ao gerar imagem:", e);
    res.status(500).send("Erro interno na geração da imagem.");
  }
}
