import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registrar fonte (ajuste o caminho conforme necessário)
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log('Fonte Inter não carregada, usando fonte padrão');
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { 
      title = 'Título da Música',
      duration = '3:00',
      views = '1.000 visualizações',
      timestamp = 'há 1 semana',
      channel = 'Canal',
      thumbnail = null,
      currentTime = '1:30',
      totalTime = '3:00'
    } = req.method === 'POST' ? req.body : req.query;

    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // PALETA DE CORES PASTÉIS MODERNA
    const colors = {
      background: '#FAF7F4',
      accent: '#A8D8EA',
      secondary: '#FFAAA7',
      tertiary: '#98DDCA',
      textPrimary: '#2D3047',
      textSecondary: '#6D6A75',
      textMuted: '#96939B',
      white: '#FFFFFF'
    };

    // FUNDO GRADIENTE PASTEL MODERNO
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, colors.background);
    bgGradient.addColorStop(0.5, '#F5F2EF');
    bgGradient.addColorStop(1, colors.background);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // ELEMENTOS DECORATIVOS DE FUNDO
    ctx.fillStyle = 'rgba(168, 216, 234, 0.1)';
    ctx.beginPath();
    ctx.arc(W - 100, 100, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 170, 167, 0.08)';
    ctx.beginPath();
    ctx.arc(100, H - 100, 120, 0, Math.PI * 2);
    ctx.fill();

    // CARTÃO PRINCIPAL COM SOMBRA
    const cardX = 60;
    const cardY = 60;
    const cardWidth = W - 120;
    const cardHeight = H - 120;

    // Sombra do cartão
    ctx.fillStyle = 'rgba(45, 48, 71, 0.05)';
    ctx.beginPath();
    ctx.roundRect(cardX + 4, cardY + 4, cardWidth, cardHeight, 25);
    ctx.fill();

    // Cartão principal
    ctx.fillStyle = colors.white;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 25);
    ctx.fill();

    // BARRA SUPERIOR COLORIDA
    const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
    headerGradient.addColorStop(0, colors.accent);
    headerGradient.addColorStop(0.5, colors.tertiary);
    headerGradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, 12, 25);
    ctx.fill();

    // THUMBNAIL DA MÚSICA (com fallback)
    const thumbSize = 220;
    const thumbX = cardX + 60;
    const thumbY = cardY + 80;

    let thumbnailLoaded = false;

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const img = await canvas.loadImage(buffer);
          
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
          ctx.clip();
          ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
          ctx.restore();
          thumbnailLoaded = true;

          // Borda sutil da thumbnail
          ctx.strokeStyle = 'rgba(45, 48, 71, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
          ctx.stroke();
        }
      } catch (imgError) {
        console.log('Erro ao carregar thumbnail, usando fallback');
      }
    }

    // FALLBACK PARA THUMBNAIL
    if (!thumbnailLoaded) {
      const fallbackUrl = 'https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg';
      try {
        const response = await fetch(fallbackUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const img = await canvas.loadImage(buffer);
          
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
          ctx.clip();
          ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
          ctx.restore();
          thumbnailLoaded = true;

          ctx.strokeStyle = 'rgba(45, 48, 71, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
          ctx.stroke();
        }
      } catch (fallbackError) {
        console.log('Fallback também falhou, usando elemento decorativo');
      }
    }

    // ELEMENTO DECORATIVO SE NENHUMA THUMBNAIL CARREGOU
    if (!thumbnailLoaded) {
      ctx.fillStyle = 'rgba(168, 216, 234, 0.2)';
      ctx.beginPath();
      ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 20);
      ctx.fill();
      
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', thumbX + thumbSize/2, thumbY + thumbSize/2 + 15);
    }

    // ÁREA DE CONTEÚDO
    const contentX = thumbX + thumbSize + 50;
    const contentY = cardY + 80;
    const contentWidth = cardWidth - (contentX - cardX) - 60;

    // BADGE "REPRODUZINDO AGORA"
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(contentX, contentY, 220, 36, 18);
    ctx.fill();

    ctx.font = '600 16px Inter';
    ctx.fillStyle = colors.white;
    ctx.textAlign = 'center';
    ctx.fillText('🎵 REPRODUZINDO AGORA', contentX + 110, contentY + 22);

    // TÍTULO DA MÚSICA (com quebra única e ellipsis)
    ctx.font = '700 46px Inter';
    ctx.fillStyle = colors.textPrimary;
    ctx.textAlign = 'left';
    
    const titleY = contentY + 90;
    const maxTitleWidth = contentWidth - 40;
    const truncatedTitle = truncateText(ctx, title, maxTitleWidth, 46);
    ctx.fillText(truncatedTitle, contentX, titleY);

    // INFORMAÇÕES EM GRID
    const infoStartY = titleY + 100;
    
    ctx.font = '500 20px Inter';
    ctx.fillStyle = colors.textSecondary;

    // Coluna 1
    ctx.fillText(`⏱️ Duração: ${duration}`, contentX, infoStartY);
    ctx.fillText(`👁️ Visualizações: ${views}`, contentX, infoStartY + 40);

    // Coluna 2
    const col2X = contentX + 280;
    ctx.fillText(`📅 Postado: ${timestamp}`, col2X, infoStartY);
    ctx.fillText(`📺 Canal: ${channel}`, col2X, infoStartY + 40);

    // BARRA DE PROGRESSO
    const barWidth = contentWidth - 40;
    const barHeight = 14;
    const barX = contentX;
    const barY = infoStartY + 120;

    // Fundo da barra
    ctx.fillStyle = 'rgba(109, 106, 117, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 8);
    ctx.fill();

    // Calcular progresso
    const currentSeconds = timeToSeconds(currentTime);
    const totalSeconds = timeToSeconds(totalTime);
    const ratio = totalSeconds > 0 ? Math.min(currentSeconds / totalSeconds, 1) : 0.5;

    // Barra de progresso com gradiente
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, colors.accent);
    progressGradient.addColorStop(0.5, colors.tertiary);
    progressGradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 8);
    ctx.fill();

    // Marcador circular
    const markerX = barX + barWidth * ratio;
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, 16, 0, Math.PI * 2);
    ctx.fillStyle = colors.white;
    ctx.fill();
    
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // TEMPOS
    const timeY = barY + 45;
    ctx.font = '600 20px Inter';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX, timeY);
    
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barWidth, timeY);

    // STATUS
    ctx.font = '500 18px Inter';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('🎶 Tocando agora • Yoshikawa Bot', contentX, barY + 85);

    // FOOTER ESTILIZADO
    const footerY = cardY + cardHeight - 40;
    
    ctx.font = '600 22px Inter';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Bot • Music Player', cardX + cardWidth/2, footerY);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(buffer);

  } catch (e) {
    console.error('Erro ao gerar banner:', e);
    res.status(500).json({ 
      error: "Erro ao gerar banner", 
      message: e.message 
    });
  }
}

// Função para truncar texto com ellipsis em uma linha
function truncateText(ctx, text, maxWidth, fontSize) {
  ctx.font = `700 ${fontSize}px Inter`;
  
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
}

// Função auxiliar para quebra de texto (mantida para compatibilidade)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lines++;
      
      // Limitar a 1 linha e adicionar ellipsis
      if (lines >= 1) {
        const truncated = truncateText(ctx, line, maxWidth, 46);
        ctx.fillText(truncated, x, currentY);
        return lines + 1;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return lines + 1;
}

// Converter tempo para segundos
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseInt(timeStr) || 0;
}
