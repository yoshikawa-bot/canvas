import path from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

//
// ---------- REGISTRO DA FONTE -----------
//

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

    // Carregar imagens
    const [bg, avatar] = await Promise.all([
      loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
      loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
    ]);

    // FUNDO COM OVERLAY MAIS MODERNO
    ctx.drawImage(bg, 0, 0, W, H);
    
    // Gradiente escuro para melhor contraste
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // AVATAR COM BORDA MAIS GROSSA
    const avatarSize = 180;
    const avatarX = 200;
    const avatarY = H / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda mais grossa e destacada
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 8;
    ctx.stroke();

    //
    // ---------- TEXTO PRINCIPAL ----------
    //

    ctx.font = '700 64px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText('Título mostrado', 420, 240);

    //
    // ---------- BARRA DE PROGRESSO MODERNA ----------
    //

    const barWidth = 520;
    const barHeight = 20;
    const barX = 420;
    const barY = 360;

    // Fundo da barra mais sutil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 12);
    ctx.fill();

    const current = 106;
    const total = 238;
    const ratio = current / total;

    // Barra de progresso com gradiente
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, '#FBE2A4');
    progressGradient.addColorStop(1, '#FFD700');
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 12);
    ctx.fill();

    // Marcador mais destacado e moderno
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(markerX, markerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FBE2A4';
    ctx.fill();

    //
    // ---------- TEXTOS DA BARRA ----------
    //

    ctx.font = '700 32px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 35);

    //
    // ---------- LINHA DECORATIVA ----------
    //

    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(420, 320);
    ctx.lineTo(820, 320);
    ctx.stroke();

    //
    // ---------- TEXTO YOSHIKAWA BOT NA BORDA INFERIOR ----------
    //

    ctx.font = '700 28px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    // Posicionado próximo à borda inferior (650px de 700px total)
    ctx.fillText('Yoshikawa Bot', W / 2, 620);

    //
    // ---------- SAÍDA ----------
    //

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
