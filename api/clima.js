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
    const PADDING = 100; 
    const CARD_RADIUS = 120;
    const BG_ZOOM = 1.0; 

    // URLs atualizadas conforme solicitado
    const dayBgUrl = 'https://yoshikawa-bot.github.io/cache/images/944ed05d.jpg';
    const nightBgUrl = 'https://yoshikawa-bot.github.io/cache/images/3f05f765.jpg';

    // Captura os dados
    const {
      dateStr = "8 de Maio",
      timeStr = "14:00",
      city = "São Paulo",    
      degree = "24°C",       
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

    // --- CONFIGURAÇÃO DE FONTES ---
    // Solicitado: Mesmo tamanho para texto superior e inferior
    const commonFontSize = 'bold 48px Inter, sans-serif'; 
    ctx.fillStyle = '#FFFFFF';
    ctx.font = commonFontSize; 
    
    // --- TEXTOS SUPERIORES (Data e Hora) ---
    const topY = 120;
    
    // Data na Esquerda Superior
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, PADDING, topY);

    // Hora na Direita Superior
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, W - PADDING, topY);

    // --- TEXTOS INFERIORES (Cidade e Graus) ---
    const bottomY = H - 100;

    // Lado Direito: Graus (Renderizamos primeiro para garantir espaço se necessário, mas mantendo a ordem visual)
    ctx.textAlign = 'right';
    ctx.fillText(degree, W - PADDING, bottomY);

    // Lado Esquerdo: Cidade
    ctx.textAlign = 'left';
    let displayCity = city;
    
    // TRUNCAMENTO DE CIDADE
    // A cidade não deve passar do meio da imagem (W / 2)
    // Largura máxima permitida = (Meio da tela) - Padding
    const maxCityWidth = (W / 2) - PADDING; 
    
    if (ctx.measureText(displayCity).width > maxCityWidth) {
       while (ctx.measureText(displayCity + '...').width > maxCityWidth && displayCity.length > 0) {
         displayCity = displayCity.slice(0, -1);
       }
       displayCity += '...';
    }
    ctx.fillText(displayCity, PADDING, bottomY);

    // --- MARCA D'ÁGUA VERTICAL (Yoshikawa) ---
    ctx.save();
    ctx.font = 'bold 20px Inter, sans-serif'; // Letras pequenas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Um pouco de transparência para ficar elegante
    
    // Posiciona na lateral direita, centralizado verticalmente
    // X = Largura total - um pequeno padding (ex: 30px da borda)
    // Y = Metade da altura
    ctx.translate(W - 40, H / 2); 
    ctx.rotate(Math.PI / 2); // Rotaciona 90 graus
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa', 0, 0);
    ctx.restore();

    ctx.restore(); // Restaura o contexto principal

    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração");
  }
}
