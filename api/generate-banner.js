import path from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const fontPath = path.join(process.cwd(), 'fonts/Inter_18pt-Bold.ttf');
if (!GlobalFonts.has('Inter')) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

export default async function handler(req, res) {
  try {
    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const [bg, avatar] = await Promise.all([
      loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
      loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
    ]);

    // FUNDO COM BLUR SIMULADO
    ctx.drawImage(bg, 0, 0, W, H);
    
    // Overlay colorido
    ctx.fillStyle = 'rgba(100, 80, 200, 0.3)';
    ctx.fillRect(0, 0, W, H);

    // CARTÃO GLASS
    const cardX = 100;
    const cardY = 100;
    const cardWidth = W - 200;
    const cardHeight = H - 200;

    // Efeito glass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Sombra do cartão
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 30);
    ctx.fill();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';

    // AVATAR COM BORDA GLASS
    const avatarSize = 140;
    const avatarX = cardX + 60;
    const avatarY = cardY + (cardHeight - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda glass
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // TÍTULO GLASS
    ctx.font = '700 60px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Título mostrado', avatarX + avatarSize + 40, avatarY + 30);

    // BARRA GLASS
    const barWidth = 480;
    const barHeight = 16;
    const barX = avatarX + avatarSize + 40;
    const barY = avatarY + 100;

    // Fundo da barra glass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    const current = 106;
    const total = 238;
    const ratio = current / total;

    // Barra de progresso
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    progressGradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // TEMPOS
    ctx.font = '700 26px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 35);

    // YOSHIKAWA BOT GLASS
    ctx.font = '700 24px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Bot', W / 2, cardY + cardHeight - 30);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
