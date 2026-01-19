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

// --- HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONSTANTES DE DESIGN ---
    const DESIGN_RES = 1080;
    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;

    // --- CÁLCULOS DE POSICIONAMENTO ---
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    // --- MEDIDAS DE UI ---
    const W = DESIGN_RES, H = DESIGN_RES;
    const PADDING = 100; // Margem interna do conteúdo
    const CARD_RADIUS = 120;
    const BG_ZOOM = 1.0; // REMOVIDO O ZOOM EXTRA (era 1.4)

    const dayBgUrl = 'https://yoshikawa-bot.github.io/cache/images/ae96713a.jpg';
    const nightBgUrl = 'https://yoshikawa-bot.github.io/cache/images/232dfce8.jpg';

    // Captura os dados do request (agora focados em clima/cidade)
    const {
      dateStr = "8 de Maio",
      timeStr = "14:00",
      city = "São Paulo",    // Lado esquerdo inferior
      degree = "24°C",       // Lado direito inferior
      theme = "day"
    } = req.method === "POST" ? req.body : req.query;

    const backgroundUrl = theme === "night" ? nightBgUrl : dayBgUrl;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- INÍCIO DA ÁREA DO "ADESIVO" ---
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

    // BG Clipping (cantos arredondados)
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // Desenha o fundo
    if (bgImg) {
      // Ajuste de escala exato para cobrir (cover) sem zoom excessivo
      const scale = Math.max(W / bgImg.width, H / bgImg.height) * BG_ZOOM;
      const wScaled = bgImg.width * scale;
      const hScaled = bgImg.height * scale;
      const x = (W - wScaled) / 2;
      const y = (H - hScaled) / 2;
      
      ctx.drawImage(bgImg, x, y, wScaled, hScaled);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, '#87CEEB');
      fallback.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }

    // --- REMOVIDOS: Linha pontilhada e Avião ---

    // --- TEXTOS SUPERIORES (Data e Hora) ---
    // Tamanho reduzido drasticamente (era 62px)
    const topY = 120;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif'; 
    
    // Data na Esquerda Superior
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, PADDING, topY);

    // Hora na Direita Superior
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, W - PADDING, topY);

    // --- TEXTOS INFERIORES (Cidade e Graus) ---
    // Posicionamento próximo ao fundo
    const bottomY = H - 100;

    // Tamanho reduzido (era 92px)
    ctx.font = 'bold 48px Inter, sans-serif';

    // Lado Esquerdo: Cidade
    ctx.textAlign = 'left';
    let displayCity = city;
    // Truncamento simples caso o nome da cidade seja gigante
    const maxTextWidth = 500;
    if (ctx.measureText(displayCity).width > maxTextWidth) {
       while (ctx.measureText(displayCity + '...').width > maxTextWidth && displayCity.length > 0) {
         displayCity = displayCity.slice(0, -1);
       }
       displayCity += '...';
    }
    ctx.fillText(displayCity, PADDING, bottomY);

    // Lado Direito: Graus
    ctx.textAlign = 'right';
    ctx.fillText(degree, W - PADDING, bottomY);

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
}
