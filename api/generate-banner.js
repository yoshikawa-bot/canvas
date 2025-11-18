import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
  try {
    const W = 1200;
    const H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // imagens
    const [bg, avatar] = await Promise.all([
      loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
      loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
    ]);

    ctx.drawImage(bg, 0, 0, W, H);

    const centerX = W / 2;
    const centerY = H / 2;

    // ---------------------- AVATAR ----------------------
    const avatarSize = 160;
    const avatarX = centerX - 300;
    const avatarY = centerY - avatarSize / 2 - 40;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // ---------------------- TÍTULO ----------------------
    ctx.font = "bold 72px sans-serif";
    ctx.fillStyle = "#FBE2A4";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "center";

    const titleX = centerX + 40;   // ligeiro deslocamento
    const titleY = avatarY + avatarSize / 2 - 20;

    ctx.fillText("Título mostrado", titleX, titleY);

    ctx.shadowBlur = 0;

    // ---------------------- BARRA ----------------------
    const barWidth = 480;   // 🔥 tamanho idêntico ao da imagem original
    const barHeight = 16;
    const barX = titleX - barWidth / 2;
    const barY = titleY + 55;

    const radius = barHeight / 2;

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // fundo branco
    ctx.fillStyle = "#FFFFFF";
    roundRect(barX, barY, barWidth, barHeight, radius);
    ctx.fill();

    // progresso
    const current = 106;
    const total = 238;
    const ratio = current / total;
    ctx.fillStyle = "#FBE2A4";
    roundRect(barX, barY, barWidth * ratio, barHeight, radius);
    ctx.fill();

    // marcador
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#FBE2A4";
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // ---------------------- HORÁRIOS ----------------------
    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "top";

    ctx.textAlign = "left";
    ctx.fillText("1:46", barX, barY + barHeight + 25);

    ctx.textAlign = "right";
    ctx.fillText("3:58", barX + barWidth, barY + barHeight + 25);

    // saída
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar" });
  }
}
