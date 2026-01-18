import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta registrar a fonte, mas usa fallback se falhar
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  // Ignora erro, usará fonte padrão do sistema
}

// --- Funções Auxiliares de Desenho ---

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
  ctx.fill();
}

// Desenha o ícone de Coração (Like)
function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // Curva esquerda
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 0.8, 0, size);
  // Curva direita
  ctx.bezierCurveTo(0, size * 0.8, size / 2, size / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.fill();
  ctx.restore();
}

// Desenha o ícone de Compartilhar (Quadrado com seta)
function drawShareIcon(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const w = size;
  const h = size;
  
  // Caixa (parte de baixo)
  ctx.beginPath();
  ctx.moveTo(x - w/2, y - h/4);
  ctx.lineTo(x - w/2, y + h/2);
  ctx.lineTo(x + w/2, y + h/2);
  ctx.lineTo(x + w/2, y - h/4);
  ctx.stroke();

  // Seta
  ctx.beginPath();
  ctx.moveTo(x, y + h/6); // base da seta
  ctx.lineTo(x, y - h/2); // ponta da seta
  ctx.stroke();

  // Cabeça da seta
  ctx.beginPath();
  ctx.moveTo(x - w/4, y - h/4);
  ctx.lineTo(x, y - h/2);
  ctx.lineTo(x + w/4, y - h/4);
  ctx.stroke();
  
  ctx.restore();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

function timeToSeconds(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function handler(req, res) {
  // Headers para evitar CORS se usar em web
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      channel = "Terence Howard",
      handle = "@terenceh",
      thumbnail = "https://i.scdn.co/image/ab67616d0000b273b5f0709d2243e8cb9e623d61", // Exemplo default
      totalTime = "2:13"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1080; // Tamanho padrão quadrado de alta qualidade
    const H = 1080;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. CARREGAR IMAGEM
    let img = null;
    try {
        // Se for URL válida
        if(thumbnail && thumbnail.startsWith('http')) {
             const response = await fetch(thumbnail);
             const buf = Buffer.from(await response.arrayBuffer());
             img = await loadImage(buf);
        }
    } catch (e) {
        console.log("Erro ao carregar imagem, usando fallback");
    }

    // 2. FUNDO (BACKGROUND)
    // Clip arredondado para o card inteiro
    const cardRadius = 80;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, cardRadius);
    ctx.clip();

    if (img) {
      // Desenha imagem cobrindo tudo (aspect ratio cover)
      const scale = Math.max(W / img.width, H / img.height);
      const x = (W / 2) - (img.width / 2) * scale;
      const y = (H / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0,0,W,H);
    }

    // Gradiente sutil para escurecer um pouco e dar contraste
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, 'rgba(0,0,0,0.1)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.5)'); // Mais escuro embaixo para os controles
    ctx.fillStyle = overlay;
    ctx.fillRect(0,0,W,H);

    // ==========================================================
    // 3. HEADER "GLASS" (Onde fica o perfil e os botões)
    // ==========================================================
    
    const padding = 60;
    const headerHeight = 160;
    const glassColor = 'rgba(40, 40, 40, 0.75)'; // Cinza escuro translúcido
    
    // -- Cápsula do Usuário (Esquerda) --
    const pillWidth = 550; 
    const pillX = padding;
    const pillY = padding;
    const pillRadius = headerHeight / 2;

    // Fundo da cápsula
    ctx.fillStyle = glassColor;
    drawRoundedRect(ctx, pillX, pillY, pillWidth, headerHeight, pillRadius);

    // Foto de perfil circular dentro da cápsula
    const avatarSize = 120;
    const avatarX = pillX + 20;
    const avatarY = pillY + (headerHeight - avatarSize)/2;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
    ctx.clip();
    if(img) {
        // Usa a mesma imagem do fundo ou uma específica se tivesse
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize); 
    } else {
        ctx.fillStyle = '#aaa';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Texto do Usuário
    const textStartX = avatarX + avatarSize + 30;
    ctx.textAlign = 'left';
    
    // Nome
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 45px Inter, sans-serif'; 
    ctx.textBaseline = 'bottom';
    ctx.fillText(truncateText(ctx, channel, 320), textStartX, pillY + headerHeight/2 - 5);

    // Handle
    ctx.fillStyle = '#cccccc'; // Cinza claro
    ctx.font = '400 35px Inter, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(truncateText(ctx, handle, 320), textStartX, pillY + headerHeight/2 + 5);


    // -- Botões Superiores (Direita) --
    const buttonSize = headerHeight; // Círculos
    const buttonY = padding;
    
    // Botão Like (Coração) - Extrema direita
    const likeX = W - padding - buttonSize;
    ctx.fillStyle = glassColor;
    ctx.beginPath();
    ctx.arc(likeX + buttonSize/2, buttonY + buttonSize/2, buttonSize/2, 0, Math.PI*2);
    ctx.fill();
    
    // Desenha ícone de coração branco
    drawHeart(ctx, likeX + buttonSize/2, buttonY + buttonSize/2 - 15, 35, '#FFFFFF');

    // Botão Share - À esquerda do Like
    const shareX = likeX - buttonSize - 20; // 20px de gap
    ctx.fillStyle = glassColor;
    ctx.beginPath();
    ctx.arc(shareX + buttonSize/2, buttonY + buttonSize/2, buttonSize/2, 0, Math.PI*2);
    ctx.fill();

    // Desenha ícone share
    drawShareIcon(ctx, shareX + buttonSize/2, buttonY + buttonSize/2, 40, '#FFFFFF');


    // ==========================================================
    // 4. PROGRESSO E CONTROLES (Rodapé)
    // ==========================================================
    
    // Configurações de tempo
    const ratio = 0.42; // Fixo para exemplo visual da foto (aprox 40%)
    const totalSec = timeToSeconds(totalTime);
    const currentSec = Math.floor(totalSec * ratio);
    const remainingSec = totalSec - currentSec;

    const progressY = H - 380;
    const progressX = padding;
    const progressWidth = W - (padding * 2);
    const barHeight = 10;

    // Tempos (flutuando acima da barra, como no Spotify)
    ctx.font = '500 35px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    
    // Tempo atual
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(currentSec), progressX, progressY - 20);
    
    // Tempo restante
    ctx.textAlign = 'right';
    ctx.fillText(`-${formatTime(remainingSec)}`, progressX + progressWidth, progressY - 20);

    // Barra Fundo (cinza translúcido)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    drawRoundedRect(ctx, progressX, progressY, progressWidth, barHeight, barHeight/2);

    // Barra Preenchida (branca)
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, progressX, progressY, progressWidth * ratio, barHeight, barHeight/2);

    // Bolinha do slider (Knob)
    ctx.beginPath();
    ctx.arc(progressX + (progressWidth * ratio), progressY + barHeight/2, 16, 0, Math.PI*2);
    ctx.fill();


    // -- Controles de Playback --
    const controlsY = H - 180;
    const centerX = W / 2;
    
    // Ícones usando path (Desenhados manualmente para ficarem limpos)
    ctx.fillStyle = '#FFFFFF';

    // Play (Triângulo central grande)
    const playSize = 50; 
    ctx.beginPath();
    // Triângulo apontando para direita
    ctx.moveTo(centerX - playSize/2 + 10, controlsY - playSize);
    ctx.lineTo(centerX + playSize + 10, controlsY);
    ctx.lineTo(centerX - playSize/2 + 10, controlsY + playSize);
    ctx.fill();

    // Rewind (<<)
    const skipOffset = 180;
    const arrowSize = 35;
    const rwX = centerX - skipOffset;
    
    ctx.beginPath();
    // Seta 1
    ctx.moveTo(rwX, controlsY);
    ctx.lineTo(rwX + arrowSize, controlsY - arrowSize);
    ctx.lineTo(rwX + arrowSize, controlsY + arrowSize);
    // Seta 2
    ctx.moveTo(rwX - arrowSize + 10, controlsY);
    ctx.lineTo(rwX + 10, controlsY - arrowSize);
    ctx.lineTo(rwX + 10, controlsY + arrowSize);
    ctx.fill();
    // Barra vertical
    ctx.fillRect(rwX - arrowSize, controlsY - arrowSize, 8, arrowSize*2);


    // Forward (>>)
    const fwX = centerX + skipOffset;
    ctx.beginPath();
    // Seta 1
    ctx.moveTo(fwX, controlsY); // Ponta esquerda (centro relativo)
    ctx.lineTo(fwX - arrowSize, controlsY - arrowSize);
    ctx.lineTo(fwX - arrowSize, controlsY + arrowSize);
    // Seta 2
    ctx.moveTo(fwX + arrowSize - 10, controlsY);
    ctx.lineTo(fwX - 10, controlsY - arrowSize);
    ctx.lineTo(fwX - 10, controlsY + arrowSize);
    ctx.fill();
    // Barra vertical
    ctx.fillRect(fwX + arrowSize - 10, controlsY - arrowSize, 8, arrowSize*2);

    // Output
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno", details: e.message });
  }
}
