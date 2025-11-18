import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
    try {
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Carregar imagens
        const [background, circle] = await Promise.all([
            loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
            loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg')
        ]);

        // Desenhar fundo
        ctx.drawImage(background, 0, 0, 800, 400);

        // Desenhar círculo central
        const circleSize = 120;
        const circleX = (800 - circleSize) / 2;
        const circleY = 80;
        
        // Sombra do círculo
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        ctx.drawImage(circle, circleX, circleY, circleSize, circleSize);
        
        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Título
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillText('# Título mostrado', 400, 250);

        // Resetar sombra para os horários
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Horários
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 36px Arial';
        
        // Primeiro horário (esquerda)
        ctx.textAlign = 'right';
        ctx.fillText('1:46', 360, 320);
        
        // Segundo horário (direita)
        ctx.textAlign = 'left';
        ctx.fillText('3:58', 440, 320);

        // Linha divisória entre horários
        ctx.strokeStyle = '#ECF0F1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(400, 300);
        ctx.lineTo(400, 340);
        ctx.stroke();

        const buffer = canvas.toBuffer('image/png');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);

    } catch (error) {
        console.error('Erro ao gerar banner:', error);
        res.status(500).json({ error: 'Erro ao gerar banner' });
    }
}

export const config = {
    api: {
        responseLimit: false,
    },
    }
