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
    
    // Overlay escuro para melhor contraste
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H / 2;

    // ---------------------- CARTA MODERNA ----------------------
    const cardWidth = 900;
    const cardHeight = 400;
    const cardX = centerX - cardWidth / 2;
    const cardY = centerY - cardHeight / 2;

    // Fundo do card com bordas arredondadas
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
    ctx.clip();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    ctx.restore(); // IMPORTANTE: Restaurar aqui para não cortar o texto
    
    // Efeito de sombra (fora do clip)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ---------------------- AVATAR MODERNO ----------------------
    const avatarSize = 180;
    const avatarX = cardX + 60;
    const avatarY = cardY + (cardHeight - avatarSize) / 2;

    ctx.save();
    
    // Borda gradiente do avatar
    const gradient = ctx.createLinearGradient(
      avatarX, avatarY, 
      avatarX + avatarSize, avatarY + avatarSize
    );
    gradient.addColorStop(0, '#FBE2A4');
    gradient.addColorStop(1, '#FF6B6B');
    
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Avatar com máscara circular
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // ---------------------- CONTEÚDO DO CARD ----------------------
    const contentX = avatarX + avatarSize + 50;
    const contentWidth = cardWidth - (contentX - cardX) - 60;

    // Título
    ctx.font = "bold 64px 'Arial', sans-serif";
    ctx.fillStyle = "#2D3748";
    ctx.textAlign = "left";
    
    const title = "Título mostrado";
    const titleY = avatarY + 50;
    
    // Sombra do texto
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(title, contentX, titleY);
    ctx.shadowBlur = 0;

    // ---------------------- BARRA DE PROGRESSO MODERNA ----------------------
    const barWidth = contentWidth;
    const barHeight = 20;
    const barX = contentX;
    const barY = titleY + 90;

    // Fundo da barra
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.fill();

    // Progresso com gradiente
    const current = 106;
    const total = 238;
    const ratio = Math.min(current / total, 1);
    
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, '#FBE2A4');
    progressGradient.addColorStop(1, '#FF8E53');
    
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
    ctx.fillStyle = progressGradient;
    ctx.fill();

    // Marcador circular
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = progressGradient;
    ctx.stroke();

    // ---------------------- INFORMAÇÕES DE TEMPO ----------------------
    const timeY = barY + barHeight + 35;
    
    ctx.font = "bold 32px 'Arial', sans-serif";
    ctx.fillStyle = "#4A5568";
    
    // Tempo atual
    ctx.textAlign = "left";
    ctx.fillText("1:46", barX, timeY);
    
    // Tempo total
    ctx.textAlign = "right";
    ctx.fillText("3:58", barX + barWidth, timeY);

    // ---------------------- BADGE DE PROGRESSO ----------------------
    const progressText = `${Math.round(ratio * 100)}%`;
    const progressBadgeX = barX + barWidth * ratio;
    const progressBadgeY = barY - 45;

    ctx.beginPath();
    ctx.roundRect(progressBadgeX - 40, progressBadgeY, 80, 35, 8);
    ctx.fillStyle = progressGradient;
    ctx.fill();
    
    ctx.font = "bold 20px 'Arial', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(progressText, progressBadgeX, progressBadgeY + 17.5);

    // ---------------------- ELEMENTOS DECORATIVOS ----------------------
    // Pontos decorativos
    ctx.fillStyle = 'rgba(251, 226, 164, 0.3)';
    for (let i = 0; i < 5; i++) {
      const dotX = cardX + 30 + i * 15;
      const dotY = cardY + 30;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---------------------- SAÍDA ----------------------
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar banner" });
  }
}
