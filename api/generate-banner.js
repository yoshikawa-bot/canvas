import { createCanvas, loadImage } from '@napi-rs/canvas'

export default async function handler(req, res) {
    try {
        // Redefinindo o canvas para uma proporção que acomode melhor o layout original.
        // Usando 1000x500 para ter espaço para todos os elementos.
        const canvasWidth = 1000;
        const canvasHeight = 500; 
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Posições e tamanhos
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const avatarSize = 130;
        const progressBarWidth = 350; // Largura da barra ajustada
        const progressBarHeight = 15; // Altura da barra
        
        // As coordenadas X e Y do grupo central (Avatar + Título + Barra)
        const groupCenterX = centerX; // O grupo central está no centro da tela (X)
        const groupCenterY = centerY + 30; // O grupo está levemente abaixo do centro da tela (Y)

        // Carregar imagens
        const [background, avatar] = await Promise.all([
            // Fundo estrelado/festivo
            loadImage('https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg'),
            // Imagem de perfil (avatar)
            loadImage('https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg') 
        ]);

        // 1. Desenhar fundo
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        // --- Variáveis de Tempo ---
        const timeStart = '1:46';
        const timeEnd = '3:58';
        const currentTime = 106; // 1:46 em segundos
        const totalTime = 238; // 3:58 em segundos
        const progressRatio = currentTime / totalTime;

        // 2. Título (Posicionado acima do centro do grupo)
        const titleText = 'Título mostrado';
        const titleFontSize = 56;
        const titleY = groupCenterY - 80; // Acima da barra de progresso

        ctx.fillStyle = '#C49646'; // Cor amarelada escura/marrom do texto original
        ctx.font = `bold ${titleFontSize}px sans-serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sombra para o texto
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 4;
        
        ctx.fillText(titleText, groupCenterX, titleY);

        // Resetar sombra após o título
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 3. Desenhar o Avatar (Círculo - Posicionado à esquerda do grupo)
        const avatarX = groupCenterX - progressBarWidth / 2 - avatarSize / 2 - 10; // À esquerda do início da barra
        const avatarY = groupCenterY - avatarSize / 2; 

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        ctx.restore(); // Restaurar o contexto para remover a máscara

        // --- Seção da Barra de Progresso ---
        const progressBarX = groupCenterX - progressBarWidth / 2; // Começa no centro - metade da largura
        const progressBarY = groupCenterY - (progressBarHeight / 2); // Centralizado verticalmente no centro do grupo

        // 4. Desenhar a Linha de Progresso Completa (Branca)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        // 5. Desenhar a Linha de Progresso Atual (Amarela/Bege Claro)
        const currentProgressWidth = progressBarWidth * progressRatio;

        ctx.fillStyle = '#FBE2A4'; // Cor amarelada/bege da imagem
        ctx.fillRect(progressBarX, progressBarY, currentProgressWidth, progressBarHeight); 

        // 6. Desenhar o Marcador de Posição (Círculo na ponta do progresso)
        const markerRadius = 12; // Raio
        const markerX = progressBarX + currentProgressWidth;
        
        ctx.beginPath();
        ctx.arc(markerX, progressBarY + progressBarHeight / 2, markerRadius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#FBE2A4'; // Cor do marcador
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF'; // Contorno branco
        ctx.stroke();

        // 7. Horários
        const timeFontSize = 36;
        const timeY = groupCenterY + progressBarHeight / 2 + 50; // Abaixo da barra de progresso
        const timeColor = '#C49646'; // Usando a mesma cor do título

        ctx.fillStyle = timeColor;
        ctx.font = `bold ${timeFontSize}px sans-serif`;
        
        // Horário de Início (esquerda)
        ctx.textAlign = 'right'; // Alinhamento à direita para que o tempo pare na posição X
        ctx.fillText(timeStart, progressBarX - 10, timeY); // Posição ligeiramente à esquerda da barra
        
        // Horário Final (direita)
        ctx.textAlign = 'left'; // Alinhamento à esquerda para que o tempo comece na posição X
        ctx.fillText(timeEnd, progressBarX + progressBarWidth + 10, timeY); // Posição ligeiramente à direita da barra
        
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
