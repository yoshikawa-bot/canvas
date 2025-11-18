import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
    try {
        const canvas = createCanvas(1200, 700);
        const ctx = canvas.getContext('2d');
        const W = 1200;
        const H = 700;

        // Carregar imagens
        const [background, avatar] = await Promise.all([
            loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
            loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
        ]);

        // Fundo
        ctx.drawImage(background, 0, 0, W, H);

        // Variáveis
        const centerX = W / 2;
        const centerY = H / 2;

        // Avatar
        const avatarSize = 165;
        const avatarX = centerX - 340;
        const avatarY = centerY - avatarSize / 2 - 20;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarSize / 2,
            avatarY + avatarSize / 2,
            avatarSize / 2,
            0,
            Math.PI * 2
        );
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Título
        const title = "Título mostrado";
        ctx.fillStyle = "#FBE2A4"; 
        ctx.font = "700 75px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const titleX = avatarX + avatarSize + 40;
        const titleY = centerY - 15;
        ctx.fillText(title, titleX, titleY);

        // Barra de Progresso
        const barWidth = 520;
        const barHeight = 18;
        const barX = titleX;
        const barY = titleY + 65;
        const radius = barHeight / 2;

        // Função para bordas arredondadas
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

        // Barra cheia (branca)
        ctx.fillStyle = "#FFFFFF";
        roundRect(barX, barY, barWidth, barHeight, radius);
        ctx.fill();

        // Progresso
        const current = 106;
        const total = 238;
        const p = current / total;

        ctx.fillStyle = "#FBE2A4";
        roundRect(barX, barY, barWidth * p, barHeight, radius);
        ctx.fill();

        // Marcador
        const markerX = barX + barWidth * p;
        const markerY = barY + barHeight / 2;

        ctx.beginPath();
        ctx.arc(markerX, markerY, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#FBE2A4";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        // Horários
        ctx.fillStyle = "#FBE2A4";
        ctx.font = "700 38px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("1:46", barX, barY + barHeight + 55);

        ctx.textAlign = "right";
        ctx.fillText("3:58", barX + barWidth, barY + barHeight + 55);

        // Saída
        const buffer = canvas.toBuffer("image/png");
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=0");
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao gerar imagem" });
    }
}
