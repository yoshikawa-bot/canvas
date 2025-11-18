// api/generate-banner.js
import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
  try {
    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Carregar imagens
    const [bg, avatar] = await Promise.all([
      loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
      loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
    ]);

    // ---------------------- FUNDO ----------------------
    ctx.drawImage(bg, 0, 0, W, H);
    
    // Overlay escuro para contraste
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    // ---------------------- AVATAR ----------------------
    const avatarSize = 180;
    const avatarX = 150;
    const avatarY = H / 2 - avatarSize / 2;

    // Avatar com borda
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda do avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 8;
    ctx.stroke();

    // ---------------------- TEXTO COM FONTE GENÉRICA ----------------------
    // Usando fonte genérica sem serifa para maior compatibilidade
    ctx.font = 'bold 70px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Texto principal - TESTE VISÍVEL
    const titleX = avatarX + avatarSize + 50;
    const titleY = avatarY + 80;
    
    // Sombra para melhor legibilidade
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillText('TÍTULO MOSTRADO', titleX, titleY);
    
    // Remove sombra para outros elementos
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // ---------------------- BARRA DE PROGRESSO ----------------------
    const barWidth = 600;
    const barHeight = 20;
    const barX = titleX;
    const barY = titleY + 80;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    // Progresso
    const current = 106;
    const total = 238;
    const ratio = current / total;

    ctx.fillStyle = '#FBE2A4';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#FBE2A4';
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // ---------------------- TEXTOS DA BARRA ----------------------
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    
    // Tempo atual
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 50);
    
    // Tempo total
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 50);

    // ---------------------- TEXTO DE PROGRESSO ----------------------
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#FBE2A4';
    ctx.textAlign = 'center';
    ctx.fillText(`PROGRESSO: ${Math.round(ratio * 100)}%`, W / 2, barY + 120);

    // ---------------------- TEXTO DE DEBUG ----------------------
    // Texto extra para garantir que algo aparece
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText('Banner Gerado com Sucesso', W - 30, H - 30);

    // ---------------------- SAÍDA ----------------------
    const buffer = canvas.toBuffer("image/png");
    
    // Headers para cache
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    
    // Retorna uma imagem de erro
    const errorCanvas = createCanvas(1200, 700);
    const errorCtx = errorCanvas.getContext('2d');
    
    errorCtx.fillStyle = '#ff0000';
    errorCtx.fillRect(0, 0, 1200, 700);
    
    errorCtx.font = 'bold 48px sans-serif';
    errorCtx.fillStyle = '#ffffff';
    errorCtx.textAlign = 'center';
    errorCtx.fillText('ERRO: ' + e.message, 600, 350);
    
    const errorBuffer = errorCanvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(errorBuffer);
  }
}
