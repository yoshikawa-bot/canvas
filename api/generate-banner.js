import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
    try {
        const canvas = createCanvas(1200, 700);
        const ctx = canvas.getContext('2d');
        const canvasWidth = 1200;
        const canvasHeight = 700;

        // Carregar imagens
        const [background, avatar] = await Promise.all([
            loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
            loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg') 
        ]);

        // 1. Desenhar fundo
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        // --- Variáveis de Posicionamento Central ---
        const centerY = canvasHeight / 2;
        const centerX = canvasWidth / 2;

        // 2. Desenhar o Avatar (Círculo)
        const avatarSize = 140;
        const avatarX = centerX - 300; 
        const avatarY = centerY - (avatarSize / 2) - 50;
        
        // Configurar a máscara de círculo
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        ctx.restore();

        // 3. Título
        const titleText = 'Título mostrado';
        const titleFontSize = 72;
        const titleY = avatarY + avatarSize / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${titleFontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;
        
        ctx.fillText(titleText, avatarX + avatarSize + 30, titleY);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // --- Seção da Barra de Progresso ---
        const progressBarWidth = 550;
        const progressBarHeight = 16;
        const progressBarY = titleY + 60;
        const progressBarX = avatarX + avatarSize + 30;

        // 4. Desenhar a Linha de Progresso Completa (Branca)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // 5. Desenhar a Linha de Progresso Atual (Amarela/Bege Claro)
        const currentTime = 106; // 1:46 em segundos
        const totalTime = 238; // 3:58 em segundos
        const progressRatio = currentTime / totalTime;
        const currentProgressWidth = progressBarWidth * progressRatio;

        ctx.fillStyle = '#FBE2A4';
        ctx.fillRect(progressBarX, progressBarY, currentProgressWidth, progressBarHeight); 

        // 6. Desenhar o Marcador de Posição (Círculo na ponta do progresso)
        const markerRadius = 10;
        const markerX = progressBarX + currentProgressWidth;
        
        ctx.beginPath();
        ctx.arc(markerX, progressBarY + progressBarHeight / 2, markerRadius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#FBE2A4';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // 7. Horários
        const timeFontSize = 36;
        const timeY = progressBarY + progressBarHeight + 40;
        const timeColor = '#FFFFFF';
        
        ctx.fillStyle = timeColor;
        ctx.font = `bold ${timeFontSize}px sans-serif`;
        
        // Primeiro horário (esquerda)
        ctx.textAlign = 'left';
        ctx.fillText('1:46', progressBarX, timeY);
        
        // Segundo horário (direita)
        ctx.textAlign = 'right';
        ctx.fillText('3:58', progressBarX + progressBarWidth, timeY);

        const buffer = canvas.toBuffer('image/png');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=0'); // Sem cache para ver mudanças
        res.send(buffer);

    } catch (error) {
        console.error('Erro ao gerar banner:', error);
        res.status(500).json({ error: 'Erro ao gerar banner' });
    }
}
