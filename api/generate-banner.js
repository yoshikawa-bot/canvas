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

    // TAMANHO AUMENTADO
    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO MAIOR E MAIS ARREDONDADO
    // =============================
    try {
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
      
      // Fundo arredondado maior
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(50, 50, W - 100, H - 100, 80); // Bordas muito arredondadas
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      // Fallback com fundo arredondado
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(50, 50, W - 100, H - 100, 80);
      ctx.clip();
      
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffb6c1");
      gradient.addColorStop(0.3, "#ff69b4");
      gradient.addColorStop(0.6, "#ff1493");
      gradient.addColorStop(1, "#db7093");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Bolhas maiores para efeito bokeh
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const radius = 40 + Math.random() * 120;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // =============================
    //         CARD CENTRAL MAIOR
    // =============================
    const cardW = 1000;  // MAIOR
    const cardH = 500;   // MAIOR
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    // Sombra mais suave
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    
    // Card maior com bordas mais arredondadas
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; // Mais transparente
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 50); // Bordas mais arredondadas
    ctx.fill();
    
    // Reset da sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //     THUMBNAIL MAIOR
    // =============================
    const coverSize = 160; // MAIOR
    const coverX = cardX + 50;
    const coverY = cardY + 50;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buf);

          ctx.save();
          ctx.beginPath();
          // Cantos mais arredondados
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 30);
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
      // Placeholder maior
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 30);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 70px Inter"; // MAIOR
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2);
    }

    // =============================
    //             TEXTOS MAIORES
    // =============================
    const textX = coverX + coverSize + 40;
    let textY = coverY + 35;

    // Título MAIOR
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Inter"; // MAIOR
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, title.toLowerCase(), 450), textX, textY);

    // Canal MAIOR
    textY += 55;
    ctx.font = "400 26px Inter"; // MAIOR
    ctx.fillStyle = "#FF62C0";
    ctx.fillText(channel.toLowerCase(), textX, textY);

    // =============================
    //     ÍCONE DE CORAÇÃO MAIOR
    // =============================
    const heartSize = 50; // MAIOR
    const heartX = cardX + cardW - 70;
    const heartY = cardY + 70;

    // Coração maior
    ctx.fillStyle = "#FF62C0";
    ctx.font = `bold ${heartSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤", heartX, heartY);

    // =============================
    //     BARRA DE PROGRESSO MAIS GROSSA
    // =============================
    const progressY = cardY + cardH - 100;
    const barW = cardW - 100;
    const barX = cardX + 50;

    // Base da barra MAIS GROSSA
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, 12, 6); // MAIS GROSSA
    ctx.fill();

    // Progresso MAIS GROSSO
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    const ratio = total > 0 ? Math.min(current / total, 1) : 0.454;

    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW * ratio, 12, 6); // MAIS GROSSA
    ctx.fill();

    // Cursor/Indicador MAIOR
    const indicatorX = barX + (barW * ratio);
    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.arc(indicatorX, progressY + 6, 18, 0, Math.PI * 2); // MAIOR
    ctx.fill();

    // Borda branca no indicador para melhor visibilidade
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // =============================
    //     INFORMAÇÕES DE TEMPO MAIORES
    // =============================
    const timeY = progressY + 45;

    // Tempos MAIORES
    ctx.font = "500 22px Inter"; // MAIOR
    ctx.fillStyle = "#FFFFFF";
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
