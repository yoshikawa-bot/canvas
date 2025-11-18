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

    // FUNDO COM EFEITO CYBER
    ctx.drawImage(bg, 0, 0, W, H);
    
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, 'rgba(10, 5, 30, 0.8)');
    gradient.addColorStop(1, 'rgba(30, 10, 50, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // LINHAS CYBER DE FUNDO
    ctx.strokeStyle = 'rgba(100, 80, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }

    // AVATAR COM BORDA NEON
    const avatarSize = 160;
    const avatarX = 180;
    const avatarY = H / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // BORDA NEON
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 6;
    ctx.stroke();

    // GLOW EFFECT
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // TÍTULO NEON
    ctx.font = '700 68px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Título mostrado', 400, 220);

    // BARRA DE PROGRESSO CYBER
    const barWidth = 540;
    const barHeight = 24;
    const barX = 400;
    const barY = 340;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    const current = 106;
    const total = 238;
    const ratio = current / total;

    // Barra de progresso com gradiente neon
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, '#8B5CF6');
    progressGradient.addColorStop(1, '#06B6D4');
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 15);
    ctx.fill();

    // Marcador cyber
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // TEMPOS
    ctx.font = '700 28px Inter';
    ctx.fillStyle = '#E5E7EB';
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 40);
    
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 40);

    // YOSHIKAWA BOT NEON
    ctx.font = '700 32px Inter';
    ctx.fillStyle = '#8B5CF6';
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Bot', W / 2, 620);

    // EFEITO DE GLOW NO TEXTO
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.fillText('Yoshikawa Bot', W / 2, 620);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
