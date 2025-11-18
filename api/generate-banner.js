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
    
    // Overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, W, H);

    // ---------------------- AVATAR ----------------------
    const avatarSize = 160;
    const avatarX = 200;
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
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 6;
    ctx.stroke();

    // ---------------------- TEXTO SIMPLES ----------------------
    // Teste básico de texto
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Texto de título - posição mais baixa
    ctx.fillText('Título mostrado', 400, 250);

    // ---------------------- BARRA DE PROGRESSO ----------------------
    const barWidth = 500;
    const barHeight = 16;
    const barX = 400;
    const barY = 350;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 8);
    ctx.fill();

    // Progresso
    const current = 106;
    const total = 238;
    const ratio = current / total;

    ctx.fillStyle = '#FBE2A4';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 8);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FBE2A4';
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // ---------------------- TEXTOS DA BARRA ----------------------
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFFFFF';
    
    // Tempo atual
    ctx.textAlign = 'left';
    ctx.fillText('1:46', barX, barY + 30);
    
    // Tempo total
    ctx.textAlign = 'right';
    ctx.fillText('3:58', barX + barWidth, barY + 30);

    // ---------------------- TEXTO DE TESTE EXTRA ----------------------
    // Texto adicional para garantir que está funcionando
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FBE2A4';
    ctx.textAlign = 'center';
    ctx.fillText(`Progresso: ${Math.round(ratio * 100)}%`, W / 2, 450);

    // ---------------------- SAÍDA ----------------------
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error('Erro detalhado:', e);
    res.status(500).json({ error: "Erro ao gerar banner: " + e.message });
  }
}
