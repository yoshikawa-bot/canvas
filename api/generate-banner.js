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

    // 1. PALETA DE CORES PASTÉIS DO NOVO DESIGN (Extraídas do rascunho da imagem)
    const colors = {
      // Fundo Gradiente Principal (Azul Claro, Rosa Claro e Branco)
      bgLightBlue: '#D5E6F5', // Cor mais fria
      bgLightPink: '#F3E4E9', // Cor mais quente
      bgStars: 'rgba(255, 255, 255, 0.5)',
      // Paleta do Cartão
      cardBackground: '#FFFFFF',
      // Cores de Destaque (Baseadas no Gradiente da Barra de Progresso/Thumbnail)
      accentLight: '#99D5E7', // Azul Claro - Início do gradiente
      accentMid: '#C1E7E3', // Média (Esverdeado)
      accentDark: '#F7C6D9', // Rosa Pastel - Fim do gradiente
      // Texto
      textPrimary: '#2D3047', // Azul Escuro (Para títulos)
      textSecondary: '#6289A4', // Azul Acinzentado (Para subtextos e infos)
      textMuted: '#96939B', // Cinza (Para footer)
    };

    // --- 2. FUNDO GRADIENTE E ESTRELAS ---

    // Fundo Gradiente
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, colors.bgLightBlue);
    bgGradient.addColorStop(1, colors.bgLightPink);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // Desenhar Estrelas (Pontos Decorativos)
    ctx.fillStyle = colors.bgStars;
    const numStars = 50;
    for (let i = 0; i < numStars; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const radius = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- 3. CARTÃO PRINCIPAL (CENTRALIZADO E COM SOMBRA SUAVE) ---

    const cardWidth = 1050;
    const cardHeight = 550;
    const cardX = (W - cardWidth) / 2;
    const cardY = (H - cardHeight) / 2;
    const borderRadius = 40;

    // Sombra do cartão (mais sutil e espalhada)
    ctx.shadowColor = 'rgba(45, 48, 71, 0.1)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;

    // Cartão principal
    ctx.fillStyle = colors.cardBackground;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    
    // Resetar a sombra para o resto dos elementos
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // --- 4. THUMBNAIL E ÍCONE DE MÚSICA DECORATIVO ---

    const thumbSize = 180;
    const thumbX = cardX + 80;
    const thumbY = cardY + 110;
    const thumbRadius = 90; // Para formato circular

    // Gradiente de Borda/Fundo do Ícone (igual ao gradiente de progresso)
    const thumbGradient = ctx.createLinearGradient(thumbX, thumbY, thumbX + thumbSize, thumbY + thumbSize);
    thumbGradient.addColorStop(0, colors.accentLight);
    thumbGradient.addColorStop(0.5, colors.accentMid);
    thumbGradient.addColorStop(1, colors.accentDark);

    let thumbnailLoaded = false;

    // Função para desenhar o fallback decorativo (ícone de música)
    const drawDecorativeFallback = () => {
        // Círculo maior (com gradiente)
        ctx.strokeStyle = thumbGradient;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(thumbX + thumbRadius, thumbY + thumbRadius, thumbRadius - 5, 0, Math.PI * 2);
        ctx.stroke();

        // Ícone de música no centro (com cores do gradiente)
        ctx.font = 'bold 50px Inter';
        ctx.textAlign = 'center';
        
        // Sombra sutil no ícone
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = colors.accentLight;
        ctx.fillText('🎵', thumbX + thumbRadius, thumbY + thumbRadius + 15);
        
        ctx.shadowBlur = 0;
    };

    if (thumbnail) {
      try {
        const response = await fetch(thumbnail);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const img = await canvas.loadImage(buffer);
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(thumbX + thumbRadius, thumbY + thumbRadius, thumbRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
          ctx.restore();
          thumbnailLoaded = true;

          // Borda sutil na thumbnail carregada (mantendo o círculo)
          ctx.strokeStyle = 'rgba(45, 48, 71, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(thumbX + thumbRadius, thumbY + thumbRadius, thumbRadius, 0, Math.PI * 2);
          ctx.stroke();

        }
      } catch (imgError) {
        console.log('Erro ao carregar thumbnail, usando fallback');
      }
    }

    // FALLBACK DECORATIVO
    if (!thumbnailLoaded) {
      drawDecorativeFallback();
    }


    // --- 5. ÁREA DE CONTEÚDO (DIREITA) ---

    const contentX = thumbX + thumbSize + 50;
    const contentY = cardY + 100;
    const contentWidth = cardX + cardWidth - contentX - 80;

    // BADGE "REPRODUZINDO AGORA"
    const badgeWidth = 200;
    const badgeHeight = 32;
    const badgeRadius = 16;
    
    ctx.fillStyle = colors.accentLight; // Use a cor mais clara para o fundo
    ctx.beginPath();
    ctx.roundRect(contentX, contentY, badgeWidth, badgeHeight, badgeRadius);
    ctx.fill();

    ctx.font = '600 16px Inter';
    ctx.fillStyle = colors.cardBackground; // Texto branco no badge
    ctx.textAlign = 'center';
    ctx.fillText('🎵 reproduzindo agora', contentX + badgeWidth/2, contentY + 21);

    // TÍTULO DA MÚSICA
    const titleY = contentY + 80;
    ctx.font = '800 52px Inter'; // Fonte mais pesada e maior
    ctx.fillStyle = colors.textPrimary;
    ctx.textAlign = 'left';
    
    const maxTitleWidth = contentWidth;
    const truncatedTitle = truncateText(ctx, title, maxTitleWidth, 52);
    ctx.fillText(truncatedTitle, contentX, titleY);

    // INFORMAÇÕES SECUNDÁRIAS (Dois blocos alinhados com espaçamento)
    const infoStartY = titleY + 50;
    const infoLineHeight = 35;
    const col2X = contentX + contentWidth / 2 - 20;

    ctx.font = '500 24px Inter';
    ctx.fillStyle = colors.textSecondary;
    
    // Bloco 1 (Duração e Visualizações)
    ctx.fillText(`⏱️ duração: ${duration}`, contentX, infoStartY);
    ctx.fillText(`👁️ visualizações: ${views}`, contentX, infoStartY + infoLineHeight);

    // Bloco 2 (Postado e Canal)
    ctx.fillText(`📅 postado: ${timestamp}`, col2X, infoStartY);
    ctx.fillText(`📺 canal: ${channel}`, col2X, infoStartY + infoLineHeight);


    // --- 6. BARRA DE PROGRESSO ---
    const barWidth = contentWidth;
    const barHeight = 10;
    const barX = contentX;
    const barY = infoStartY + 100;

    // Fundo da barra (Cor cinza muito clara)
    ctx.fillStyle = 'rgba(150, 147, 155, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.fill();

    // Calcular progresso
    const currentSeconds = timeToSeconds(currentTime);
    const totalSeconds = timeToSeconds(totalTime);
    const ratio = totalSeconds > 0 ? Math.min(currentSeconds / totalSeconds, 1) : 0.5;

    // Barra de progresso com gradiente
    const progressGradientBar = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradientBar.addColorStop(0, colors.accentLight);
    progressGradientBar.addColorStop(0.5, colors.accentMid);
    progressGradientBar.addColorStop(1, colors.accentDark);
    
    ctx.fillStyle = progressGradientBar;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 5);
    ctx.fill();

    // Marcador circular
    const markerX = barX + barWidth * ratio;
    const markerRadius = 12;
    
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, markerRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.cardBackground; // Branco
    ctx.fill();
    
    // Borda do marcador com o gradiente
    ctx.strokeStyle = progressGradientBar;
    ctx.lineWidth = 4;
    ctx.stroke();

    // TEMPOS
    const timeY = barY + 45;
    ctx.font = '600 20px Inter';
    ctx.fillStyle = colors.textSecondary;
    
    // Tempo atual (Esquerda)
    ctx.textAlign = 'left';
    ctx.fillText(currentTime, barX, timeY);
    
    // Tempo total (Direita)
    ctx.textAlign = 'right';
    ctx.fillText(totalTime, barX + barWidth, timeY);

    // STATUS (Abaixo da barra de progresso)
    const statusY = timeY + 40;
    ctx.font = '500 20px Inter';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText('🎶 tocando agora • Yoshikawa Bot', contentX, statusY);


    // --- 7. FOOTER ESTILIZADO ---

    const footerY = H - 50;
    
    ctx.font = '600 24px Inter';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Bot • Music Player', W/2, footerY);

    // --- 8. SAÍDA ---
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
  ctx.font = `800 ${fontSize}px Inter`;
  
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
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
