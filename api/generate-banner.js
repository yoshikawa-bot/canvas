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

    // FUNDO CLARO E LIMPO
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, W, H);

    // AVATAR QUADRADO COM SOMBRA
    const avatarSize = 140;
    const avatarX = 200;
    const avatarY = H / 2 - avatarSize / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(avatarX + 8, avatarY + 8, avatarSize, avatarSize);

    // Avatar quadrado
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);

    // Borda sutil
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 3;
    ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);

    // TÍTULO MINIMALISTA
    ctx.font = '700 56px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Título mostrado', 380, 250);

    // BARRA MINIMALISTA
    const barWidth = 520;
    const barHeight = 6;
    const barX = 380;
    const barY = 350;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const current = 106;
    const total = 238;
    const ratio = current / total;

    // Barra de progresso
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

    // Marcador circular
    const markerX = barX + barWidth * ratio;
    ctx.beginPath();
    ctx.arc(markerX, barY + barHeight / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // TEMPOS
    ctx.font = '700 24px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 30);
    
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 30);

    // LINHA DIVISÓRIA
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(380, 400);
    ctx.lineTo(900, 400);
    ctx.stroke();

    // YOSHIKAWA BOT DISCRETO
    ctx.font = '700 20px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Yoshikawa Bot', W / 2, 650);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
