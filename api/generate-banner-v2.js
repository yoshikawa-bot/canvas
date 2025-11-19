// api/generate-banner-v2.js
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de fontes
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Não foi possível carregar a fonte Inter. Usando padrão.");
}

// Função para truncar texto
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

// Função para calcular tempo
function calculateTimeFromPercentage(totalTime, percentage) {
  const timeToSeconds = (t) => {
    const p = t.split(':').map(Number);
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
  };
  
  const totalSeconds = timeToSeconds(totalTime);
  const currentSeconds = Math.floor(totalSeconds * percentage);
  
  const minutes = Math.floor(currentSeconds / 60);
  const seconds = currentSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Título da música",
      channel = "Nome do canal",
      thumbnail = null,
      currentTime = "1:46",
      totalTime = "3:56"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO GRADIENTE MODERNO
    // =============================
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // =============================
    //   EFEITO DE PARTÍCULAS
    // =============================
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const radius = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // =============================
    //   CARD PRINCIPAL
    // =============================
    const cardWidth = 1000;
    const cardHeight = 600;
    const cardX = (W - cardWidth) / 2;
    const cardY = (H - cardHeight) / 2;

    // Sombra do card
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // Card com bordas arredondadas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 40);
    ctx.fill();
    
    // Reset sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // =============================
    //   THUMBNAIL
    // =============================
    const thumbSize = 300;
    const thumbX = cardX + 50;
    const thumbY = cardY + 50;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buffer);
          
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
          ctx.clip();
          ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
          ctx.restore();
        }
      } catch (e) {
        console.log("Erro ao carregar thumbnail:", e);
      }
    }

    // Fallback para thumbnail
    if (!thumbnail) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.beginPath();
      ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
      ctx.fill();
      
      ctx.fillStyle = '#667eea';
      ctx.font = 'bold 80px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎵', thumbX + thumbSize/2, thumbY + thumbSize/2);
    }

    // =============================
    //   INFORMAÇÕES DO VÍDEO
    // =============================
    const infoX = thumbX + thumbSize + 40;
    const infoY = thumbY + 60;

    // Título
    ctx.fillStyle = '#333';
    ctx.font = 'bold 50px Inter';
    ctx.textAlign = 'left';
    const titleText = truncateText(ctx, title, cardWidth - (infoX - cardX) - 50);
    ctx.fillText(titleText, infoX, infoY);

    // Canal
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 35px Inter';
    ctx.fillText(channel, infoX, infoY + 70);

    // =============================
    //   BARRA DE PROGRESSO
    // =============================
    const progressY = infoY + 180;
    const progressWidth = cardWidth - 100;
    const progressX = cardX + 50;
    const progressHeight = 12;
    const progressRatio = 0.4; // 40%

    // Barra de fundo
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth, progressHeight, progressHeight/2);
    ctx.fill();

    // Progresso
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth * progressRatio, progressHeight, progressHeight/2);
    ctx.fill();

    // Bolinha do progresso
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(progressX + (progressWidth * progressRatio), progressY + progressHeight/2, 15, 0, Math.PI * 2);
    ctx.fill();

    // =============================
    //   TEMPOS
    // =============================
    const timeY = progressY + 40;
    const calculatedTime = calculateTimeFromPercentage(totalTime, progressRatio);

    ctx.fillStyle = '#666';
    ctx.font = 'bold 25px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(calculatedTime, progressX, timeY);
    
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, progressX + progressWidth, timeY);

    // =============================
    //   RODAPÉ
    // =============================
    const footerY = cardY + cardHeight - 30;
    
    ctx.fillStyle = '#999';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Reproduzindo agora', cardX + cardWidth/2, footerY);

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (error) {
    console.error('Erro no novo design:', error);
    res.status(500).json({ error: 'Erro ao gerar imagem', message: error.message });
  }
      }
