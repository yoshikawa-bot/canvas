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
const COLOR_BASE_BG = "rgba(255, 255, 255, 0.35)"; // Cor do card: Branco com transparência (Efeito Fosco)
const COLOR_PROGRESS_BASE = "rgba(255, 255, 255, 0.7)"; // Cor da base da barra de progresso
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
      currentTime = "1:46", // Tempo padrão (45%) para simular a imagem de referência
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
      
      // Fundo arredondado
      ctx.save();
      ctx.beginPath();
      // Borda do fundo do canvas mais arredondada
      ctx.roundRect(50, 50, W - 100, H - 100, 80); 
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      // Fallback com fundo arredondado gradiente rosa (simulando o bokeh/blur)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(50, 50, W - 100, H - 100, 80);
      ctx.clip();
      
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffe5ed"); // Rosa bem claro
      gradient.addColorStop(0.5, "#ffb3c8"); // Rosa médio
      gradient.addColorStop(1, "#db7093"); // Rosa escuro
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      ctx.restore();
    }

    // =============================
    //         CARD CENTRAL MAIOR (1200x700)
    // =============================
    const cardW = 1200;  // Largura grande
    const cardH = 700;   // Altura grande
    const cardX = (W - cardW) / 2; // Centralizado em X
    const cardY = (H - cardH) / 2; // Centralizado em Y

    // Sombra mais suave para destacar o efeito "flutuante"
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 25;
    
    // Card grande com bordas arredondadas e efeito fosco
    ctx.fillStyle = COLOR_BASE_BG; 
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 50); // Bordas arredondadas
    ctx.fill();
    
    // Reset da sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //     THUMBNAIL (ÍCONE DA MÚSICA)
    // =============================
    const coverSize = 250; // Tamanho do ícone
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
          // Cantos muito arredondados para o thumbnail (como na imagem)
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 45); 
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
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 45);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 120px Inter"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2);
    }

    // =============================
    //             TEXTOS
    // =============================
    const textX = coverX + coverSize + 50;
    let textY = coverY + 70;

    // Título (Maior, Branco)
    ctx.fillStyle = COLOR_TEXT_TITLE;
    ctx.font = "bold 60px Inter"; 
    ctx.textAlign = "left";
    // Largura máxima para evitar sobreposição com o coração
    ctx.fillText(truncateText(ctx, title, 750), textX, textY); 

    // Canal (Menor, Rosa)
    textY += 70; 
    ctx.font = "400 35px Inter"; 
    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.fillText(channel, textX, textY);

    // =============================
    //     ÍCONE DE CORAÇÃO GRANDE
    // =============================
    const heartSize = 80; 
    const heartX = cardX + cardW - 100;
    const heartY = coverY + 40; // Alinhado verticalmente com o bloco de texto/imagem

    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.font = `bold ${heartSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤", heartX, heartY);

    // =============================
    //     BARRA DE PROGRESSO
    // =============================
    const progressY = cardY + cardH - 180; // Posição abaixo do texto/imagem
    const barW = cardW - 160; // Largura da barra
    const barX = cardX + 80;
    const barThickness = 20; // Espessura
    const indicatorSize = 30; // Raio do círculo branco (maior que a barra)

    // 1. Base da barra (Branco Semi-transparente, Capsule Shape)
    ctx.fillStyle = COLOR_PROGRESS_BASE;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, barThickness, barThickness / 2);
    ctx.fill();

    // 2. Progresso (Calculado a partir do tempo, com fallback visual da imagem)
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    // 45% é o que a imagem de referência mostra (1:46 / 3:56)
    const ratio = total > 0 ? Math.min(current / total, 1) : 0.45; 
    
    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.beginPath();
    // O progresso deve terminar exatamente na posição do indicador
    const filledWidth = barW * ratio;
    ctx.roundRect(barX, progressY, filledWidth, barThickness, barThickness / 2);
    ctx.fill();

    // 3. Cursor/Indicador (Círculo Branco Grande, como na imagem)
    const indicatorX = barX + filledWidth;
    
    // Círculo branco externo
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(indicatorX, progressY + barThickness / 2, indicatorSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Borda fina rosa para o indicador (para dar o efeito de profundidade)
    ctx.strokeStyle = COLOR_HIGHLIGHT;
    ctx.lineWidth = 4;
    ctx.stroke();

    // =============================
    //     INFORMAÇÕES DE TEMPO
    // =============================
    const timeY = progressY + barThickness + 35; // Posição do tempo

    // Tempos (Branco Semi-transparente, menor que o título)
    ctx.font = "500 30px Inter"; 
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
