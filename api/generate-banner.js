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
      title = "Título da Música",
      channel = "Nome do Canal",
      thumbnail = null,
      currentTime = "1:30",
      totalTime = "3:00"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO - AGORA FUNCIONANDO
    // =============================
    try {
      const response = await fetch("https://yoshikawa-bot.github.io/cache/images/09b10e07.jpg");
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      ctx.drawImage(bg, 0, 0, W, H);
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo:", e);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }

    // =============================
    //         CARD CENTRAL
    // =============================
    const cardW = 1000;
    const cardH = 520;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 50);
    ctx.fill();

    // =============================
    //     THUMBNAIL / CAPA
    // =============================
    const coverSize = 260;
    const coverX = cardX + 70;
    const coverY = cardY + 130;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buf);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
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
      ctx.fillStyle = "#ffffff22";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 120px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2 + 10);
    }

    // =============================
    //             TEXTOS
    // =============================
    const textX = coverX + coverSize + 80;
    let textY = coverY + 20;

    // Título
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 54px Inter";
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, title, 420), textX, textY);

    // Canal (rosa claro)
    textY += 55;
    ctx.font = "400 30px Inter";
    ctx.fillStyle = "#FF62C0";
    ctx.fillText(channel, textX, textY);

    // Coração rosa
    ctx.font = "bold 60px Inter";
    ctx.fillStyle = "#FF61C7";
    ctx.fillText("❤", cardX + cardW - 90, cardY + 90);

    // =============================
    //     BARRA DE PROGRESSO
    // =============================
    const progressY = textY + 120;
    const barW = 420;
    const barH = 10;

    // Base
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(textX, progressY, barW, barH, 5);
    ctx.fill();

    // Progresso
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    const ratio = total > 0 ? Math.min(current / total, 1) : 0;

    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.roundRect(textX, progressY, barW * ratio, barH, 5);
    ctx.fill();

    // Tempos
    ctx.font = "500 22px Inter";
    ctx.fillStyle = "#FFFFFF";

    ctx.textAlign = "left";
    ctx.fillText(currentTime, textX, progressY + 35);

    ctx.textAlign = "right";
    ctx.fillText(totalTime, textX + barW, progressY + 35);

    // Footer
    ctx.font = "400 20px Inter";
    ctx.fillStyle = "#ffffff77";
    ctx.textAlign = "center";
    ctx.fillText("Yoshikawa Music Player", W/2, H - 35);

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
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
