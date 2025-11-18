import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
    try {
        // O banner da imagem parece ter uma proporção mais ampla, por exemplo 1280x720,
        // mas vou manter a proporção mais próxima da imagem original com base no seu código (800x400),
        // ajustando o tamanho para um visual mais próximo.
        const canvas = createCanvas(1200, 700); // Ajustado para melhor proporção
        const ctx = canvas.getContext('2d');
        const canvasWidth = 1200;
        const canvasHeight = 700;

        // Carregar imagens (presumindo que essas URLs contêm os assets corretos: fundo estrelado e avatar)
        const [background, avatar] = await Promise.all([
            // URL do fundo estrelado/festivo da imagem
            loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
            // URL da imagem de perfil (avatar)
            loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg') 
        ]);

        // 1. Desenhar fundo
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        // --- Variáveis de Posicionamento Central ---
        const centerY = canvasHeight / 2;
        const centerX = canvasWidth / 2;

        // 2. Desenhar o Avatar (Círculo)
        const avatarSize = 140; // Um pouco maior que o original
        // Posicionamento: Esquerda da seção de título/progresso
        const avatarX = centerX - 300; 
        const avatarY = centerY - (avatarSize / 2) - 50; // Alinhado verticalmente à esquerda do título
        
        // Configurar a máscara de círculo
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        ctx.restore(); // Restaurar o contexto para remover a máscara

        // 3. Título
        const titleText = 'Título mostrado';
        const titleFontSize = 72;
        const titleY = avatarY + avatarSize / 2; // Centralizado verticalmente na linha do avatar

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${titleFontSize}px sans-serif`; // Usando sans-serif para um visual mais limpo/moderno
        ctx.textAlign = 'left'; // O título está alinhado à esquerda do avatar
        ctx.textBaseline = 'middle';
        
        // Sombra para o texto (Dá o efeito de "brilho" da imagem)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;
        
        // Posição: À direita do avatar, alinhado com o centro vertical dele
        ctx.fillText(titleText, avatarX + avatarSize + 30, titleY);

        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // --- Seção da Barra de Progresso ---
        const progressBarWidth = 550;
        const progressBarHeight = 16;
        const progressBarY = titleY + 60; // Abaixo do título
        const progressBarX = avatarX + avatarSize + 30; // Alinhado com o título

        // 4. Desenhar a Linha de Progresso Completa (Branca)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // 5. Desenhar a Linha de Progresso Atual (Amarela/Bege Claro)
        const currentTime = 106; // 1:46 em segundos
        const totalTime = 238; // 3:58 em segundos
        const progressRatio = currentTime / totalTime;
        const currentProgressWidth = progressBarWidth * progressRatio;

        ctx.fillStyle = '#FBE2A4'; // Cor amarelada/bege da imagem
        // A barra de progresso é desenhada por cima da barra branca
        ctx.fillRect(progressBarX, progressBarY, currentProgressWidth, progressBarHeight); 

        // 6. Desenhar o Marcador de Posição (Círculo na ponta do progresso)
        const markerRadius = 10;
        const markerX = progressBarX + currentProgressWidth;
        
        ctx.beginPath();
        ctx.arc(markerX, progressBarY + progressBarHeight / 2, markerRadius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#FBE2A4'; // Cor do marcador igual à barra de progresso
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF'; // Contorno branco
        ctx.stroke();

        // 7. Horários
        const timeFontSize = 36;
        const timeY = progressBarY + progressBarHeight + 40; // Abaixo da barra de progresso
        const timeColor = '#FFFFFF';
        
        ctx.fillStyle = timeColor;
        ctx.font = `bold ${timeFontSize}px sans-serif`;
        
        // Primeiro horário (esquerda) - Alinhado com o início da barra
        ctx.textAlign = 'left';
        ctx.fillText('1:46', progressBarX, timeY);
        
        // Segundo horário (direita) - Alinhado com o fim da barra
        ctx.textAlign = 'right';
        ctx.fillText('3:58', progressBarX + progressBarWidth, timeY);

        // --- Finalização ---
        const buffer = canvas.toBuffer('image/png');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);

    } catch (error) {
        console.error('Erro ao gerar banner:', error);
        res.status(500).json({ error: 'Erro ao gerar banner' });
    }
}
