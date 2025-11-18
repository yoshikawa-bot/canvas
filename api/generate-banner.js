import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Fontes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Não foi possível carregar a fonte Inter. Usando padrão.");
}

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

    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO - EFEITO BOKEH ROSA
    // =============================
    try {
      // URL alternativa para teste
      const bgUrl = "https://yoshikawa-bot.github.io/cache/images/09b10e07.jpg";
      console.log("Tentando carregar imagem de fundo:", bgUrl);
      
      const response = await fetch(bgUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      
      console.log("Imagem de fundo carregada com sucesso");
      ctx.drawImage(bg, 0, 0, W, H);
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      // Fallback: gradiente rosa suave com efeito bokeh
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffb6c1");
      gradient.addColorStop(0.3, "#ff69b4");
      gradient.addColorStop(0.6, "#ff1493");
      gradient.addColorStop(1, "#db7093");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Adicionar bolhas para efeito bokeh
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const radius = 20 + Math.random() * 80;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // =============================
    //         CARD CENTRAL - GLASSMORPHISM
    // =============================
    const cardW = 900;
    const cardH = 400;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    // Sombra suave
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // Card com transparência e bordas muito arredondadas
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 40);
    ctx.fill();
    
    // Reset da sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //     THUMBNAIL / CAPA - CANTO SUPERIOR ESQUERDO
    // =============================
    const coverSize = 120;
    const coverX = cardX + 40;
    const coverY = cardY + 40;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buf);

          ctx.save();
          ctx.beginPath();
          // Cantos muito arredondados como na descrição
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 25);
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
          ctx.restore();

          thumbnailLoaded = true;
        }
      } catch (e) {
        console.log("Erro ao carregar thumbnail:", e);
      }
    }

    if (!thumbnailLoaded) {
      // Placeholder estilo kawaii
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 25);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 50px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2);
    }

    // =============================
    //             TEXTOS - ALINHADOS À DIREITA DA MINIATURA
    // =============================
    const textX = coverX + coverSize + 30;
    let textY = coverY + 25;

    // Título (em minúsculas como na imagem)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Inter";
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, title.toLowerCase(), 350), textX, textY);

    // Canal (rosa choque/magenta) - em minúsculas
    textY += 40;
    ctx.font = "400 20px Inter";
    ctx.fillStyle = "#FF62C0";
    ctx.fillText(channel.toLowerCase(), textX, textY);

    // =============================
    //     ÍCONE DE CORAÇÃO - CANTO SUPERIOR DIREITO
    // =============================
    const heartSize = 40;
    const heartX = cardX + cardW - 60;
    const heartY = cardY + 60;

    // Coração sólido rosa choque
    ctx.fillStyle = "#FF62C0";
    ctx.font = `bold ${heartSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤", heartX, heartY);

    // =============================
    //     BARRA DE PROGRESSO - PARTE INFERIOR CENTRAL
    // =============================
    const progressY = cardY + cardH - 80;
    const barW = cardW - 80;
    const barX = cardX + 40;

    // Base da barra (branca)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, 8, 4);
    ctx.fill();

    // Progresso (rosa vibrante/choque)
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    const ratio = total > 0 ? Math.min(current / total, 1) : 0.454; // ~45.4% como na descrição

    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW * ratio, 8, 4);
    ctx.fill();

    // Cursor/Indicador (círculo rosa)
    const indicatorX = barX + (barW * ratio);
    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.arc(indicatorX, progressY + 4, 12, 0, Math.PI * 2);
    ctx.fill();

    // =============================
    //     INFORMAÇÕES DE TEMPO
    // =============================
    const timeY = progressY + 35;

    // Tempo atual (esquerda, branco)
    ctx.font = "500 18px Inter";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(currentTime, barX, timeY);

    // Tempo total (direita, branco)
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
