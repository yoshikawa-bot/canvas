import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constantes de estilo
const ACCENT_PINK = '#FF66AA'; // Rosa vibrante para o progresso e coração
const BACKGROUND_URL = 'https://yoshikawa-bot.github.io/cache/images/09b10e07.jpg'; // URL da imagem de fundo

// Registrar fonte Inter
try {
  // O path da fonte está fora da função principal, mas a verificação é mantida.
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log('Fonte Inter não carregada, usando fonte padrão');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      title = 'Título da Música',
      channel = 'Canal',
      thumbnail = null,
      currentTime = '1:46',
      totalTime = '3:56'
    } = req.method === 'POST' ? req.body : req.query;

    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // --- FUNDO COM IMAGEM E EFEITO BLUR/WASH ---
    let bgImage;
    try {
      const bgResponse = await fetch(BACKGROUND_URL);
      if (bgResponse.ok) {
        const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());
        bgImage = await loadImage(bgBuffer);
      }
    } catch (e) {
      console.error('Erro ao carregar imagem de fundo:', e.message);
    }

    if (bgImage) {
      // Desenha a imagem de fundo cobrindo o canvas
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = W / H;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = H;
        drawW = H * imgRatio;
        drawX = (W - drawW) / 2;
        drawY = 0;
      } else {
        drawW = W;
        drawH = W / imgRatio;
        drawX = 0;
        drawY = (H - drawH) / 2;
      }

      // 1. Desenha a imagem base
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

      // 2. Aplica filtro de desfoque (Blur) e overlay de cor para o efeito wash
      // Nota: o NAPI-RS pode não suportar 'blur' nativamente via filter, mas tentaremos
      // para garantir a fidelidade, usando o overlay para o efeito de cor.
      ctx.filter = 'blur(10px)';
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH); // Desenha a imagem novamente, desfocada
      ctx.filter = 'none'; // Reseta o filtro

      // 3. Aplica o overlay (wash) rosa transparente
      ctx.fillStyle = 'rgba(255, 192, 203, 0.5)'; // Rosa claro com 50% de opacidade
      ctx.fillRect(0, 0, W, H);
      
    } else {
      // Fallback simples
      ctx.fillStyle = '#FFC0CB'; // Rosa claro sólido
      ctx.fillRect(0, 0, W, H);
    }

    // --- CARD CENTRAL (Glassmorphism) ---
    const cardW = 900;
    const cardH = 500;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;
    const CARD_RADIUS = 32;
    const CARD_MARGIN = 60;
    const coverSize = 300; // Tamanho da capa/thumbnail

    // 1. Aplica Sombra (para destacar o card do fundo)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    
    // 2. Desenha a base translúcida do card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Branco com 40% de transparência
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, CARD_RADIUS);
    ctx.fill();

    // 3. Adiciona borda branca sutil para o efeito "fosco"
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Reseta a sombra
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'transparent';


    // --- CAPA / THUMBNAIL ---
    const coverX = cardX + CARD_MARGIN;
    const coverY = cardY + CARD_MARGIN;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buffer);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(coverX, coverY, coverSize, coverSize, 20); // Borda mais suave para a capa
          ctx.clip();
          ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
          ctx.restore();

          thumbnailLoaded = true;
        }
      } catch (e) { console.error('Erro ao carregar thumbnail:', e.message); }
    }

    // Fallback
    if (!thumbnailLoaded) {
      ctx.fillStyle = 'rgba(255, 200, 220, 0.6)'; // Rosa pálido de fallback
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Ícone branco
      ctx.font = 'bold 120px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎵', coverX + coverSize / 2, coverY + coverSize / 2 + 15);
    }

    // --- TEXTO ---
    const textX = coverX + coverSize + 40;
    let textY = coverY + 50; // Ajustado para alinhar com a capa

    // Título
    ctx.fillStyle = '#111';
    ctx.font = '800 50px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(truncateText(ctx, title, 420), textX, textY);

    // Canal (cor rosa/vinho)
    textY += 40;
    ctx.font = '500 28px Inter';
    ctx.fillStyle = '#C75887';
    ctx.fillText(channel, textX, textY);


    // --- ÍCONE DE CORAÇÃO ---
    const heartX = cardX + cardW - CARD_MARGIN - 30; // Mais à direita
    const heartY = coverY + coverSize / 2; // Centralizado verticalmente com a capa/texto

    ctx.font = '60px Inter';
    ctx.fillStyle = ACCENT_PINK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', heartX, heartY);


    // --- BARRA DE PROGRESSO ---
    const progressY = cardY + cardH - 120; // Posição mais baixa no card
    const barX = coverX;
    const barW = cardW - 2 * CARD_MARGIN; // 780
    const barH = 12;

    // Recalcula o ratio
    const current = timeToSeconds(currentTime);
    const total = timeToSeconds(totalTime);
    const ratio = total > 0 ? Math.min(current / total, 1) : 0;

    // Base (Cinza claro)
    ctx.fillStyle = '#F5F5F7';
    ctx.beginPath();
    ctx.roundRect(barX, progressY, barW, barH, 6);
    ctx.fill();

    // Progresso (Rosa vibrante)
    const progressWidth = barW * ratio;
    ctx.fillStyle = ACCENT_PINK;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, progressWidth, barH, 6);
    ctx.fill();

    // Thumb (Círculo de progresso)
    const thumbR = 10;
    const thumbX = barX + progressWidth;

    // Círculo base (Branco)
    ctx.beginPath();
    ctx.arc(thumbX, progressY + barH / 2, thumbR, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Borda (Rosa vibrante)
    ctx.lineWidth = 4;
    ctx.strokeStyle = ACCENT_PINK;
    ctx.stroke();
    ctx.lineWidth = 1; // Reseta a largura da linha

    // Tempos (Time stamps)
    ctx.font = '600 24px Inter';
    ctx.fillStyle = '#111';

    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX, progressY + 45);

    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barW, progressY + 45);

    // SAÍDA
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao gerar banner', message: e.message });
  }
}

// FUNÇÕES AUXILIARES (Mantidas do original)
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function timeToSeconds(t) {
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}
