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
} catch (e) { }

const RAIN_URL = 'https://yoshikawa-bot.github.io/cache/images/437170b4.png';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const DESIGN_RES = 1080;
    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;

    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES, H = DESIGN_RES;
    const PADDING = 100;
    const CARD_RADIUS = 120;
    const BG_ZOOM = 1.0;

    const dayBgUrl     = 'https://yoshikawa-bot.github.io/cache/images/944ed05d.jpg';
    const eveningBgUrl = 'https://yoshikawa-bot.github.io/cache/images/01ca9c67.jpg';
    const nightBgUrl   = 'https://yoshikawa-bot.github.io/cache/images/3f05f765.jpg';

    const {
      dateStr = "8 de Maio",
      timeStr = "14:00",
      city = "São Paulo",
      degree = "24°C",
      theme = "day",
      rain = "false"
    } = req.method === "POST" ? req.body : req.query;

    const isRaining = rain === "true" || rain === true;
    const backgroundUrl = theme === "night" ? nightBgUrl : theme === "evening" ? eveningBgUrl : dayBgUrl;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    let bgImg = null;

    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        const buf = Buffer.from(await response.arrayBuffer());
        bgImg = await loadImage(buf);
      }
    } catch (e) {}

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    if (bgImg) {
      const scale = Math.max(W / bgImg.width, H / bgImg.height) * BG_ZOOM;
      const wScaled = bgImg.width * scale;
      const hScaled = bgImg.height * scale;
      const x = (W - wScaled) / 2;
      const y = (H - hScaled) / 2;
      ctx.drawImage(bgImg, x, y, wScaled, hScaled);
    } else {
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, W, H);
    }

    if (isRaining) {
      try {
        const rainResponse = await fetch(RAIN_URL);
        if (rainResponse.ok) {
          const rainBuf = Buffer.from(await rainResponse.arrayBuffer());
          const rainImg = await loadImage(rainBuf);
          ctx.drawImage(rainImg, 0, 0, W, H);
        }
      } catch (e) {}
    }

    const commonFontSize = 'bold 48px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = commonFontSize;

    const topY = 120;

    ctx.textAlign = 'left';
    ctx.fillText(dateStr, PADDING, topY);

    ctx.textAlign = 'right';
    ctx.fillText(timeStr, W - PADDING, topY);

    if (theme === "day" && !isRaining) {
      ctx.fillStyle = '#121212';
    }

    const bottomY = H - 100;

    ctx.textAlign = 'right';
    ctx.fillText(degree, W - PADDING, bottomY);

    ctx.textAlign = 'left';
    let displayCity = city;

    const maxCityWidth = (W / 2) - PADDING;

    if (ctx.measureText(displayCity).width > maxCityWidth) {
      while (ctx.measureText(displayCity + '...').width > maxCityWidth && displayCity.length > 0) {
        displayCity = displayCity.slice(0, -1);
      }
      displayCity += '...';
    }
    ctx.fillText(displayCity, PADDING, bottomY);

    ctx.save();
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.translate(W - 40, H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa', 0, 0);
    ctx.restore();

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
}
