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

    // Fundo
    ctx.drawImage(bg, 0, 0, W, H);
    
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H / 2;

    // Card simples sem clip
    const cardWidth = 900;
    const cardHeight = 400;
    const cardX = centerX - cardWidth / 2;
    const cardY = centerY - cardHeight / 2;

    // Fundo do card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
    ctx.fill();

    // Avatar
    const avatarSize = 180;
    const avatarX = cardX + 60;
    const avatarY = cardY + (cardHeight - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda do avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Título - AGORA DEVE APARECER
    const contentX = avatarX + avatarSize + 50;
    
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = "#2D3748";
    ctx.textAlign = "left";
    ctx.fillText("Título mostrado", contentX, avatarY + 80);

    // Barra de progresso
    const barWidth = 500;
    const barHeight = 20;
    const barX = contentX;
    const barY = avatarY + 160;

    ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    const current = 106;
    const total = 238;
    const ratio = current / total;

    ctx.fillStyle = '#FBE2A4';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
    ctx.fill();

    // Tempos
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#4A5568";
    ctx.textAlign = "left";
    ctx.fillText("1:46", barX, barY + 40);
    
    ctx.textAlign = "right";
    ctx.fillText("3:58", barX + barWidth, barY + 40);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar banner" });
  }
}
