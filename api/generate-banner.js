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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      title = "Título da música em destaque",
      channel = "Canal de Conteúdo Oficial",
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
    //         CARD CENTRAL MAIOR (1200x700)
    // =============================
    const cardW = 1200;  // MAIOR
    const cardH = 700;   // MAIOR
    const cardX = (W - cardW) / 2; // Centralizado em X: 100
    const cardY = (H - cardH) / 2; // Centralizado em Y: 100

    // Sombra mais suave
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;
    
    // Card maior com bordas mais arredondadas
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)"; // Mais transparente
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 50); // Bordas mais arredondadas
    ctx.fill();
    
    // Reset da sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // =============================
    //     THUMBNAIL MAIOR (250x250)
    // =============================
    const coverSize = 250; // MUITO MAIOR
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
          // Cantos mais arredondados
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 40);
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
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 40);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 120px Inter"; // MUITO MAIOR
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", coverX + coverSize/2, coverY + coverSize/2);
    }

    // =============================
    //             TEXTOS MAIORES
    // =============================
    const textX = coverX + coverSize + 50;
    let textY = coverY + 60;

    // Título MAIOR
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 60px Inter"; // MAIOR
    ctx.textAlign = "left";
    // Ajuste a largura máxima para o novo tamanho do card
    ctx.fillText(truncateText(ctx, title.toLowerCase(), 700), textX, textY); 

    // Canal MAIOR
    textY += 80; // Aumento da separação
    ctx.font = "400 35px Inter"; // MAIOR
    ctx.fillStyle = "#FF62C0";
    ctx.fillText(channel.toLowerCase(), textX, textY);

    // =============================
    //     ÍCONE DE CORAÇÃO MAIOR
    // =============================
    const heartSize = 80; // MUITO MAIOR
    const heartX = cardX + cardW - 100;
    const heartY = cardY + 120; // Posição ajustada

    // Coração maior
    ctx.fillStyle = "#FF62C0";
    ctx.font = `bold ${heartSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤", heartX, heartY);

    // =============================
    //     BARRA DE PROGRESSO MAIS GROSSA E FIXADA EM 40%
    // =============================
    const progressY = cardY + cardH - 120; // Posição ajustada
    const barW = cardW - 160; // Largura ligeiramente menor
    const barX = cardX + 80;
    const barThickness = 30; // MUITO MAIS GROSSA

    // Base da barra MAIS GROSSA
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, barThickness, barThickness / 2);
    ctx.fill();

    // Progresso MAIS GROSSO (FIXO em 40% ou 0.4)
    const fixedRatio = 0.4; // 40% Fixo
    
    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    // Usa roundRect para preenchimento, garantindo cantos arredondados
    ctx.roundRect(barX, progressY, barW * fixedRatio, barThickness, barThickness / 2);
    ctx.fill();

    // Cursor/Indicador MAIOR
    const indicatorSize = 25; // MAIOR
    const indicatorX = barX + (barW * fixedRatio);
    ctx.fillStyle = "#FF6EB4";
    ctx.beginPath();
    ctx.arc(indicatorX, progressY + barThickness / 2, indicatorSize, 0, Math.PI * 2);
    ctx.fill();

    // Borda branca no indicador para melhor visibilidade
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5; // Borda mais grossa
    ctx.stroke();

    // =============================
    //     INFORMAÇÕES DE TEMPO MAIORES
    // =============================
    const timeY = progressY + barThickness + 30; // Ajustado para a barra mais grossa

    // Tempos MAIORES
    ctx.font = "500 30px Inter"; // MAIOR
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
  // Função mantida, mas não é usada para calcular o progresso, que é fixo em 40%
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
                   }
