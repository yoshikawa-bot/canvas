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

    // FUNDO ESCURO PROFISSIONAL
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, '#0F0F0F');
    bgGradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // ELEMENTO DECORATIVO LATERAL
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(0, 0, 8, H);

    // AVATAR COM BORDA METÁLICA
    const avatarSize = 150;
    const avatarX = 120;
    const avatarY = H / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda metálica
    const borderGradient = ctx.createRadialGradient(
      avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 3,
      avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2
    );
    borderGradient.addColorStop(0, '#FF6B35');
    borderGradient.addColorStop(1, '#FF8E35');
    
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 6;
    ctx.stroke();

    // TÍTULO PROFISSIONAL
    ctx.font = '700 58px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Título mostrado', 320, 240);

    // SUBTÍTULO
    ctx.font = '500 24px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Reproduzindo agora', 320, 300);

    // BARRA DE PROGRESSO PROFISSIONAL
    const barWidth = 540;
    const barHeight = 12;
    const barX = 320;
    const barY = 360;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.fill();

    const current = 106;
    const total = 238;
    const ratio = current / total;

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
    ctx.fillText('1:46', barX, barY + 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 35);

    // INFORMAÇÕES ADICIONAIS
    ctx.font = '500 20px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText(`Capítulo ${current} de ${total}`, 320, 420);

    // YOSHIKAWA BOT PROFISSIONAL
    ctx.font = '700 26px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('Yoshikawa Bot', W - 60, H - 40);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
