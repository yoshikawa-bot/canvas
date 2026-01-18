import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CARREGAMENTO DE FONTES ---
try {
  // Certifique-se de ter a fonte Inter (ou San Francisco) disponível
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  const fontRegularPath = path.join(__dirname, '../fonts/Inter_18pt-Regular.ttf'); 
  
  if (!GlobalFonts.has('Inter-Bold')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter-Bold');
  }
  // Se tiver a regular, carregue também, se não, usa a Bold para tudo com peso diferente
  if (!GlobalFonts.has('Inter-Regular')) {
      try { GlobalFonts.registerFromPath(fontRegularPath, 'Inter-Regular'); } catch(e){}
  }
} catch (e) { 
  console.log("Erro ao carregar fonte:", e);
}

// --- 2. FUNÇÕES AUXILIARES ---

// Função para desenhar texto com quebra de linha e reticências (...)
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    const maxLines = 2; // Máximo de linhas permitidas antes do ...

    ctx.textAlign = 'center';
    
    // Primeiro, verifica se o texto inteiro cabe em uma linha
    if (ctx.measureText(text).width <= maxWidth) {
         ctx.fillText(text, x, y);
         return y + lineHeight;
    }

    // Se não couber, faz o processo de quebra
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            // Se atingiu o limite de linhas, desenha com ... e para
            if (lineCount >= maxLines - 1) {
                line = line.trim();
                // Remove ultimos caracteres para caber o "..." se necessario, 
                // mas aqui simplificamos desenhando a linha atual + ...
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
    // Desenha a última linha (se não tiver estourado o limite acima)
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight; // Retorna a posição Y final
}

// Desenha o Chevron (Seta >)
function drawChevron(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size/1.5, y);
    ctx.lineTo(x, y + size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

// --- 3. HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONFIGURAÇÃO ---
    const W = 800;
    const H = 1000; // Layout Vertical
    
    const {
      name = "Dawn Ramirez (Eu)", // Nome longo para testar
      username = "dawn_ramirez@icloud.com", // Email/ID
      pp = "https://i.imgur.com/Te0cnz2.png" 
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // --- FUNDO GERAL (Branco / Light Mode) ---
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Carregar Imagem do Avatar
    let img = null;
    try {
        const response = await fetch(pp);
        const arrayBuffer = await response.arrayBuffer();
        img = await loadImage(Buffer.from(arrayBuffer));
    } catch (e) {
        console.log("Erro imagem fallback");
    }

    const centerX = W / 2;
    
    // --- 1. AVATAR (Centralizado no topo) ---
    const avatarSize = 250;
    const avatarY = 180; // Centro vertical do avatar
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    
    if (img) {
        // Desenha imagem preenchendo o circulo
        ctx.drawImage(img, centerX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    } else {
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(centerX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    }
    ctx.restore();

    // --- 2. TEXTOS CENTRAIS ---
    
    // NOME (Bold, Preto)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 75px Inter-Bold, sans-serif'; // Fonte grande
    
    const nameY = avatarY + avatarSize/2 + 80; // Posição abaixo do avatar
    const maxTextWidth = W - 100; // Margem de 50px de cada lado
    
    // Chama a função de quebra de linha
    drawWrappedText(ctx, name, centerX, nameY, maxTextWidth, 85);

    // SUBTITULO (Ex: "Adulto" ou Cargo - Fixo ou via variavel)
    ctx.fillStyle = '#8E8E93'; // Cinza Apple
    ctx.font = '500 40px Inter-Regular, sans-serif';
    // Colocamos um pouco abaixo do nome (estimativa, se o nome tiver 2 linhas isso pode sobrepor, 
    // num cenário ideal calculariamos a altura retornada do drawWrappedText)
    ctx.fillText("Adulto", centerX, nameY + 110); 


    // --- 3. RODAPÉ (Caixa "ID Apple") ---
    
    const boxHeight = 160;
    const boxWidth = W - 80; // Margem lateral de 40px
    const boxX = 40;
    const boxY = H - boxHeight - 60; // 60px de margem inferior
    const boxRadius = 30;

    // Fundo da caixa (Cinza Claro)
    ctx.fillStyle = '#F2F2F7'; 
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, boxRadius);
    ctx.fill();

    // Ícone (Quadrado Cinza Escuro simulando logo Apple)
    const iconSize = 90;
    const iconX = boxX + 35;
    const iconY = boxY + (boxHeight - iconSize) / 2;
    
    ctx.fillStyle = '#8E8E93'; // Cinza do ícone
    // Se tiver o PNG da maçã, use drawImage aqui. Vou desenhar um rect arredondado placeholder.
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 20);
    ctx.fill();
    
    // Simulação visual do logo da Apple (Opcional, apenas um circulo branco dentro)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(iconX + iconSize/2, iconY + iconSize/2, 20, 0, Math.PI*2); 
    ctx.fill();

    // Texto do Rodapé
    ctx.textAlign = 'left';
    
    // Título "ID Apple"
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Inter-Bold, sans-serif';
    ctx.fillText("ID Apple", iconX + iconSize + 30, iconY + 45);

    // Email / User
    ctx.fillStyle = '#8E8E93'; // Cinza texto secundário
    ctx.font = '400 32px Inter-Regular, sans-serif';
    // Corta o email se for muito longo para não sair da caixa
    let displayEmail = username;
    if (displayEmail.length > 28) displayEmail = displayEmail.substring(0, 28) + "...";
    
    ctx.fillText(displayEmail, iconX + iconSize + 30, iconY + 85);

    // Seta (Chevron) na direita
    drawChevron(ctx, boxX + boxWidth - 50, boxY + boxHeight/2, 12, '#C7C7CC');

    // --- FINALIZAR ---
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração do banner");
  }
}
