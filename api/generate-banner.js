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

    // FUNDO ESCURO PROFISSIONAL
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, '#0F0F0F');
    bgGradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // ELEMENTO DECORATIVO LATERAL
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(0, 0, 8, H);

    // THUMBNAIL DA MÚSICA (se fornecido)
    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const img = await canvas.loadImage(buffer);
        
        // Thumbnail com borda arredondada
        const thumbSize = 200;
        const thumbX = 80;
        const thumbY = H / 2 - thumbSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 15);
        ctx.clip();
        ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
        ctx.restore();

        // Borda da thumbnail
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 15);
        ctx.stroke();

      } catch (imgError) {
        console.log('Erro ao carregar thumbnail, usando layout padrão');
        // Fallback: elemento decorativo no lugar da thumbnail
        ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
        ctx.beginPath();
        ctx.roundRect(80, H/2 - 100, 200, 200, 15);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B35';
        ctx.font = 'bold 40px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('🎵', 180, H/2 + 10);
      }
    } else {
      // Elemento decorativo quando não há thumbnail
      ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
      ctx.beginPath();
      ctx.roundRect(80, H/2 - 100, 200, 200, 15);
      ctx.fill();
      
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 40px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', 180, H/2 + 10);
    }

    // TÍTULO DA MÚSICA
    ctx.font = '700 52px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    
    // Quebra de linha para título longo
    const maxTitleWidth = 700;
    const titleLines = wrapText(ctx, title, 320, 220, maxTitleWidth, 60);
    
    // SUBTÍTULO (REPRODUZINDO AGORA)
    ctx.font = '500 24px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Reproduzindo agora', 320, 300);

    // INFORMAÇÕES DA MÚSICA
    const infoY = titleLines * 60 + 250;
    
    ctx.font = '500 20px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Duração: ${duration}`, 320, infoY);
    ctx.fillText(`Visualizações: ${views}`, 320, infoY + 35);
    ctx.fillText(`Postado: ${timestamp}`, 320, infoY + 70);
    ctx.fillText(`Canal: ${channel}`, 320, infoY + 105);

    // BARRA DE PROGRESSO
    const barWidth = 540;
    const barHeight = 12;
    const barX = 320;
    const barY = H - 180;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.fill();

    // Calcular progresso
    const currentSeconds = timeToSeconds(currentTime);
    const totalSeconds = timeToSeconds(totalTime);
    const ratio = totalSeconds > 0 ? currentSeconds / totalSeconds : 0.5;

    // Barra de progresso
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, '#FF6B35');
    progressGradient.addColorStop(1, '#FF8E35');
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 6);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // TEMPOS
    ctx.font = '700 22px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX, barY + 35);
    
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barWidth, barY + 35);

    // STATUS DE REPRODUÇÃO
    ctx.font = '500 20px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('🎵 Tocando agora • Yoshikawa Bot', 320, H - 100);

    // FOOTER
    ctx.font = '700 26px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('Yoshikawa Bot • Music Player', W - 60, H - 40);

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

// Função auxiliar para quebra de texto
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
      
      // Limitar a 2 linhas
      if (lines >= 2) {
        ctx.fillText(line.slice(0, 30) + '...', x, currentY);
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
