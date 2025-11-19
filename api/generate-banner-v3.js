import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

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

let COLOR_HIGHLIGHT = "#FF6EB4";
const COLOR_BASE_BG = "rgba(0, 0, 0, 0.5)";
const COLOR_PROGRESS_BASE = "rgba(255, 255, 255, 0.3)";
const COLOR_TEXT_TITLE = "#FFFFFF";
const COLOR_TEXT_TIME = "rgba(255, 255, 255, 0.9)";

function getDominantColor(imageData) {
  const data = imageData.data;
  const colorCount = {};
  let maxCount = 0;
  let dominantColor = '#FF6EB4';

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 220) continue;
    
    const color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    colorCount[color] = (colorCount[color] || 0) + 1;
    
    if (colorCount[color] > maxCount) {
      maxCount = colorCount[color];
      dominantColor = color;
    }
  }

  return dominantColor;
}

function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Usuário",
      thumbnail = "https://yoshikawa-bot.github.io/cache/images/236744bb.jpg"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    try {
      const bgUrl = "https://yoshikawa-bot.github.io/cache/images/76f9e52a.jpg";
      const response = await fetch(bgUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120);
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120);
      ctx.clip();
      
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffe5ed");
      gradient.addColorStop(0.5, "#ffb3c8");
      gradient.addColorStop(1, "#db7093");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    const cardW = 1200;
    const cardH = 700;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 25;
    
    ctx.fillStyle = COLOR_BASE_BG; 
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 80);
    ctx.fill();
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const coverSize = 400;
    const coverX = cardX + 80;
    const coverY = cardY + 80;

    let thumbnailLoaded = false;
    let dominantColor = COLOR_HIGHLIGHT;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buf = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buf);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 60);
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
          ctx.restore();

          const tempCanvas = createCanvas(coverSize, coverSize);
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, coverSize, coverSize);
          const imageData = tempCtx.getImageData(0, 0, coverSize, coverSize);
          dominantColor = getDominantColor(imageData);
          
          const rgb = parseInt(dominantColor.replace("#", ""), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = (rgb >> 0) & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          if (brightness < 100) {
            dominantColor = adjustColorBrightness(dominantColor, 40);
          }

          thumbnailLoaded = true;
        }
      } catch (e) {
        console.log("Erro ao carregar thumbnail:", e);
      }
    }

    if (!thumbnailLoaded) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 60);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 180px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", coverX + coverSize/2, coverY + coverSize/2);
    }

    COLOR_HIGHLIGHT = dominantColor;

    const textX = coverX + coverSize + 60;
    let textY = coverY + 150;

    ctx.fillStyle = COLOR_TEXT_TITLE;
    ctx.font = "bold 80px Inter";
    ctx.textAlign = "left";
    ctx.fillText("Bem-vindo(a)!", textX, textY);

    textY += 120;

    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.font = "bold 70px Inter";
    ctx.fillText(truncateText(ctx, title, 650), textX, textY);

    const progressY = cardY + cardH - 150;
    const barW = 800;
    const barX = cardX + (cardW - barW) / 2;
    const barThickness = 25;

    const gradient = ctx.createLinearGradient(barX, progressY, barX + barW, progressY);
    gradient.addColorStop(0, COLOR_HIGHLIGHT);
    gradient.addColorStop(1, adjustColorBrightness(COLOR_HIGHLIGHT, 30));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, barThickness, barThickness / 2);
    ctx.fill();

    const statusY = progressY + barThickness + 45;
    ctx.font = "bold 40px Inter";
    ctx.fillStyle = COLOR_TEXT_TIME;
    ctx.textAlign = "center";
    ctx.fillText("YOSHIKAWA BOT", barX + barW / 2, statusY);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro geral:", e);
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
      }
