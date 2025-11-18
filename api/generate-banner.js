import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync } from 'fs'

// Registrar fontes customizadas
try {
  const fontPaths = {
    'Roboto': './fonts/Roboto-Regular.ttf',
    'Roboto Bold': './fonts/Roboto-Bold.ttf'
  }

  for (const [fontName, fontPath] of Object.entries(fontPaths)) {
    if (existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath, fontName)
      console.log(`✅ Fonte registrada: ${fontName}`)
    } else {
      console.log(`❌ Arquivo não encontrado: ${fontPath}`)
    }
  }

  console.log('📝 Fontes disponíveis:', GlobalFonts.getFamilies())
} catch (error) {
  console.error('❌ Erro ao registrar fontes:', error)
}

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    // ---------------------- AVATAR ----------------------
    const avatarSize = 180;
    const avatarX = 150;
    const avatarY = H / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda do avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBE2A4';
    ctx.lineWidth = 8;
    ctx.stroke();

    // ---------------------- TEXTO COM FONTES CUSTOM ----------------------
    const titleX = avatarX + avatarSize + 50;
    const titleY = avatarY + 80;

    // Verificar quais fontes estão disponíveis
    const availableFonts = GlobalFonts.getFamilies();
    console.log('🎨 Fontes custom disponíveis:', availableFonts);

    // Usar Roboto Bold se disponível, senão tentar outras
    let fontFamily = 'Roboto Bold';
    if (!availableFonts.includes('Roboto Bold')) {
      if (availableFonts.includes('Arial')) fontFamily = 'Arial';
      else if (availableFonts.includes('DejaVu Sans')) fontFamily = 'DejaVu Sans';
      else fontFamily = availableFonts[0] || 'sans-serif';
    }

    console.log('🔤 Usando fonte:', fontFamily);

    // TEXTO PRINCIPAL
    ctx.font = `bold 70px ${fontFamily}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Contorno para garantir visibilidade
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('TÍTULO MOSTRADO', titleX, titleY);
    
    // Preenchimento
    ctx.fillText('TÍTULO MOSTRADO', titleX, titleY);

    // ---------------------- BARRA DE PROGRESSO ----------------------
    const barWidth = 600;
    const barHeight = 20;
    const barX = titleX;
    const barY = titleY + 80;

    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    // Progresso
    const current = 106;
    const total = 238;
    const ratio = current / total;

    ctx.fillStyle = '#FBE2A4';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#FBE2A4';
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // ---------------------- TEXTOS NUMÉRICOS ----------------------
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.fillStyle = '#FFFFFF';
    
    // Tempo atual
    ctx.textAlign = 'left';
    ctx.strokeText('1:46', barX, barY + 50);
    ctx.fillText('1:46', barX, barY + 50);
    
    // Tempo total
    ctx.textAlign = 'right';
    ctx.strokeText('3:58', barX + barWidth, barY + 50);
    ctx.fillText('3:58', barX + barWidth, barY + 50);

    // Texto de progresso
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.fillStyle = '#FBE2A4';
    ctx.textAlign = 'center';
    const progressText = `PROGRESSO: ${Math.round(ratio * 100)}%`;
    ctx.strokeText(progressText, W / 2, barY + 120);
    ctx.fillText(progressText, W / 2, barY + 120);

    // ---------------------- SAÍDA ----------------------
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(buffer);

  } catch (e) {
    console.error('❌ Erro detalhado:', e);
    
    // Imagem de erro com diagnóstico
    const errorCanvas = createCanvas(1200, 700);
    const errorCtx = errorCanvas.getContext('2d');
    
    errorCtx.fillStyle = '#1a202c';
    errorCtx.fillRect(0, 0, 1200, 700);
    
    errorCtx.fillStyle = '#ffffff';
    errorCtx.font = 'bold 40px sans-serif';
    errorCtx.textAlign = 'center';
    errorCtx.fillText('ERRO AO GERAR BANNER', 600, 300);
    
    errorCtx.font = 'bold 20px sans-serif';
    errorCtx.fillText(e.message, 600, 350);
    
    const availableFonts = GlobalFonts.getFamilies();
    errorCtx.fillText(`Fontes disponíveis: ${availableFonts.join(', ')}`, 600, 400);
    
    const errorBuffer = errorCanvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(errorBuffer);
  }
}
