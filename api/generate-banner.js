import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Fontes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Nota: A fonte Inter deve ser carregada no ambiente de execução.
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Não foi possível carregar a fonte Inter. Usando padrão.");
}

// =============================
//      CONFIGURAÇÃO DE CORES
// =============================
const COLOR_HIGHLIGHT = "#FF6EB4"; // Rosa forte para progresso, coração e canal
const COLOR_BASE_BG = "rgba(0, 0, 0, 0.6)"; // Card MAIS TRANSPARENTE
const COLOR_PROGRESS_BASE = "rgba(255, 255, 255, 0.3)"; // Cor da base da barra de progresso
const COLOR_TEXT_TITLE = "#FFFFFF"; // Branco
const COLOR_TEXT_TIME = "rgba(255, 255, 255, 0.9)"; // Branco Semi-transparente

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Título da musica",
      channel = "Canal",
      thumbnail = null,
      currentTime = "1:46",
      totalTime = "3:56"
    } = req.method === "POST" ? req.body : req.query;

    // TAMANHO DO CANVAS (1400x900)
    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO MAIOR E ARREDONDADO COM FALLBACK ROSA
    // =============================
    try {
      const bgUrl = "https://yoshikawa-bot.github.io/cache/images/09b10e07.jpg";
      const response = await fetch(bgUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      
      // Fundo arredondado - bordas MUITO mais arredondadas
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120); // Bordas muito mais arredondadas
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      // Fallback com fundo arredondado gradiente rosa
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120); // Bordas muito mais arredondadas
      ctx.clip();
      
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffe5ed");
      gradient.addColorStop(0.5, "#ffb3c8");
      gradient.addColorStop(1, "#db7093");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      ctx.restore();
    }

    // =============================
    //         CARD CENTRAL MAIOR (1200x700)
    // =============================
    const cardW = 1200;
    const cardH = 700;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    // Sombra mais suave
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 25;
    
    // Card PRETO MAIS TRANSPARENTE com bordas MUITO arredondadas
    ctx.fillStyle = COLOR_BASE_BG; 
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 80); // Bordas MUITO mais arredondadas
    ctx.fill();
    
    // Reset da sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //     THUMBNAIL (ÍCONE DA MÚSICA) - MUITO MAIOR
    // =============================
    const coverSize = 400; // FOTO MUITO MAIOR
    const coverX = cardX + 80;
    const coverY = cardY + 80;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buf);

          ctx.save();
          ctx.beginPath();
          // Cantos MUITO arredondados para o thumbnail
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 60); 
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
          ctx.restore();

          thumbnailLoaded = true;
        }
      } catch (e) {
        console.log("Erro ao carregar thumbnail:", e);
      }
    }

    // Placeholder
    if (!thumbnailLoaded) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 60); // Bordas muito arredondadas
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 180px Inter"; // Ícone maior
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2);
    }

    // =============================
    //             TEXTOS - MUITO MAIORES
    // =============================
    const textX = coverX + coverSize + 60;
    let textY = coverY + 100;

    // Título MUITO MAIOR
    ctx.fillStyle = COLOR_TEXT_TITLE;
    ctx.font = "bold 80px Inter"; // LETRAS BEM MAIORES
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, title, 650), textX, textY); 

    // Canal MUITO MAIOR
    textY += 100; 
    ctx.font = "bold 50px Inter"; // NOME DO CANAL BEM MAIOR
    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.fillText(channel, textX, textY);

    // =============================
    //     BARRA DE PROGRESSO - MENOR E MUITO MAIS GROSSA
    // =============================
    const progressY = cardY + cardH - 150;
    const barW = 800; // BARRA MENOR
    const barX = cardX + (cardW - barW) / 2; // Centralizada
    const barThickness = 35; // MUITO MAIS GROSSA
    const indicatorSize = 45; // Indicador maior

    // 1. Base da barra
    ctx.fillStyle = COLOR_PROGRESS_BASE;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, barThickness, barThickness / 2);
    ctx.fill();

    // 2. Progresso - SEMPRE 40% CARREGADA
    const ratio = 0.4; // SEMPRE 40%
    
    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.beginPath();
    const filledWidth = barW * ratio;
    ctx.roundRect(barX, progressY, filledWidth, barThickness, barThickness / 2);
    ctx.fill();

    // 3. Cursor/Indicador - AGORA TODO ROSA
    const indicatorX = barX + filledWidth;
    
    // Círculo ROSA (ao invés de branco)
    ctx.fillStyle = COLOR_HIGHLIGHT; // ROSA
    ctx.beginPath();
    ctx.arc(indicatorX, progressY + barThickness / 2, indicatorSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Borda branca fina para contraste
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();

    // =============================
    //     INFORMAÇÕES DE TEMPO - NÚMEROS BEM MAIORES
    // =============================
    const timeY = progressY + barThickness + 50;

    // Tempos - NÚMEROS BEM MAIORES
    ctx.font = "bold 45px Inter"; // NÚMEROS BEM MAIORES
    ctx.fillStyle = COLOR_TEXT_TIME;

    ctx.textAlign = "left";
    ctx.fillText(currentTime, barX, timeY);

    ctx.textAlign = "right";
    ctx.fillText(totalTime, barX + barW, timeY);

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro geral:", e);
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
}

// =============================
//        FUNÇÕES AUXILIARES
// =============================
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

function timeToSeconds(t) {
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
                 }
