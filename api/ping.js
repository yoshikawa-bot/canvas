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

// =============================
//      CONFIGURAÇÃO DE CORES
// =============================
const COLOR_HIGHLIGHT = "#FF6EB4";
const COLOR_BASE_BG = "rgba(0, 0, 0, 0.5)";
const COLOR_TEXT_TITLE = "#FFFFFF";
const COLOR_TEXT_PING = "#FFD700";
const COLOR_TEXT_SUBTITLE = "rgba(255, 255, 255, 0.8)";

// Função principal do handler HTTP
export default async function handler(req, res) {
  // Configurações CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Obter parâmetros do ping
    const { ping } = req.method === "POST" ? req.body : req.query;
    
    if (!ping) {
      return res.status(400).json({ error: "Parâmetro 'ping' é obrigatório" });
    }

    const pingValue = parseInt(ping);
    
    const W = 1200;
    const H = 600;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // =============================
    //   FUNDO MAIOR E ARREDONDADO
    // =============================
    try {
      const bgUrl = "https://yoshikawa-bot.github.io/cache/images/09b10e07.jpg";
      const response = await fetch(bgUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 80);
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 80);
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
    //         CARD CENTRAL
    // =============================
    const cardW = 1000;
    const cardH = 400;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;
    
    ctx.fillStyle = COLOR_BASE_BG; 
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 60);
    ctx.fill();
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //         ÍCONE DO BOT
    // =============================
    const iconSize = 180;
    const iconX = cardX + 80;
    const iconY = cardY + (cardH - iconSize) / 2;

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 40);
    ctx.fill();

    ctx.fillStyle = COLOR_HIGHLIGHT;
    ctx.font = "bold 100px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🤖", iconX + iconSize/2, iconY + iconSize/2);

    // =============================
    //             TEXTOS
    // =============================
    const textX = iconX + iconSize + 60;
    let textY = cardY + 120;

    // Título YOSHIKAWA BOT
    ctx.fillStyle = COLOR_TEXT_TITLE;
    ctx.font = "bold 70px Inter";
    ctx.textAlign = "left";
    ctx.fillText("YOSHIKAWA BOT", textX, textY);

    // Ping value
    textY += 120;
    ctx.font = "bold 60px Inter";
    ctx.fillStyle = COLOR_TEXT_PING;
    ctx.fillText(`${pingValue}ms`, textX, textY);

    // Status
    textY += 80;
    ctx.font = "bold 40px Inter";
    ctx.fillStyle = COLOR_TEXT_SUBTITLE;
    
    let statusText = "⚡ CONEXÃO ESTÁVEL";
    let statusColor = "#00FF00";
    
    if (pingValue > 200) {
      statusText = "⚠️  CONEXÃO LENTA";
      statusColor = "#FFA500";
    } else if (pingValue > 500) {
      statusText = "🔴 CONEXÃO INSTÁVEL";
      statusColor = "#FF4444";
    }
    
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, textX, textY);

    // =============================
    //     EFEITOS VISUAIS EXTRAS
    // =============================
    
    // Círculo pulsante ao redor do ping
    ctx.strokeStyle = COLOR_TEXT_PING;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.6;
    
    const pulseX = textX + ctx.measureText(`${pingValue}ms`).width + 50;
    const pulseY = cardY + 180;
    
    ctx.beginPath();
    ctx.arc(pulseX, pulseY, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=0');
    res.send(buffer);

  } catch (e) {
    console.error("Erro ao gerar imagem de ping:", e);
    res.status(500).json({ 
      error: "Erro interno do servidor", 
      message: e.message 
    });
  }
      }
