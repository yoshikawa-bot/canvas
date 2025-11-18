import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
  try {
    const canvas = createCanvas(1200, 700);
    const ctx = canvas.getContext('2d');
    const W = 1200;
    const H = 700;

    // carregar imagens
    const [background, avatar] = await Promise.all([
      loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
      loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
    ]);

    // desenhar fundo
    ctx.drawImage(background, 0, 0, W, H);

    // posições centrais de referência
    const centerX = W / 2;
    const centerY = H / 2;

    // avatar (círculo) - posicionado mais à esquerda, como na referência
    const avatarSize = 170;
    const avatarX = centerX - 420; // movi mais para a esquerda
    const avatarY = centerY - avatarSize / 2 - 10;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // TITULO - centralizado horizontalmente próximo ao centro (sobre a barra)
    const title = "Título mostrado";
    ctx.font = "700 76px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // sombra suave para dar contraste (não pesada)
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "#FBE2A4"; // bege claro
    const titleX = centerX + 60; // pequeno deslocamento para a direita (parecido com a referência)
    const titleY = centerY - 80; // acima da barra

    ctx.fillText(title, titleX, titleY);

    // reset sombra para elementos seguintes (outras sombras específicas podem ser aplicadas se precisar)
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // BARRA DE PROGRESSO - centralizada em relação ao título
    const barWidth = 640;
    const barHeight = 18;
    const barX = titleX - barWidth / 2;
    const barY = titleY + 80; // logo abaixo do título
    const radius = barHeight / 2;

    // função rounded rect
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

    // barra completa (branca)
    ctx.fillStyle = "#FFFFFF";
    roundRect(barX, barY, barWidth, barHeight, radius);
    ctx.fill();

    // progresso atual (bege)
    const current = 106; // 1:46
    const total = 238;   // 3:58
    const ratio = Math.max(0, Math.min(1, current / total));
    ctx.fillStyle = "#FBE2A4";
    roundRect(barX, barY, barWidth * ratio, barHeight, radius);
    ctx.fill();

    // marcador circular (bege com borda branca)
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#FBE2A4";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // HORÁRIOS - alinhados com a barra (esquerda / direita)
    ctx.fillStyle = "#FBE2A4";
    ctx.font = "700 36px sans-serif";
    ctx.textBaseline = "top";

    // esquerda
    ctx.textAlign = "left";
    ctx.fillText("1:46", barX, barY + barHeight + 22);

    // direita
    ctx.textAlign = "right";
    ctx.fillText("3:58", barX + barWidth, barY + barHeight + 22);

    // saída
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=0");
    res.send(buffer);

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro ao gerar imagem" });
  }
}
