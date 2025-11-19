import { createCanvas, loadImage } from '@napi-rs/canvas';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { 
      user1 = "https://yoshikawa-bot.github.io/cache/images/236744bb.jpg",
      user2 = "https://yoshikawa-bot.github.io/cache/images/236744bb.jpg"
    } = req.method === "POST" ? req.body : req.query;

    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Fundo igual ao do welcome
    try {
      const bgUrl = "https://yoshikawa-bot.github.io/cache/images/76f9e52a.jpg";
      const response = await fetch(bgUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bg = await loadImage(buffer);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120);
      ctx.clip();
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
      
    } catch (e) {
      console.log("Erro ao carregar imagem de fundo, usando fallback:", e.message);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 120);
      ctx.clip();
      
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
      gradient.addColorStop(0, "#ffe5ed");
      gradient.addColorStop(0.5, "#ffb3c8");
      gradient.addColorStop(1, "#db7093");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Card igual ao do welcome
    const cardW = 1200;
    const cardH = 700;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 25;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 80);
    ctx.fill();
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Tamanho das fotos (bem maiores)
    const photoSize = 350;
    const photoRadius = 175;

    // Posições das fotos
    const photo1X = cardX + 150;
    const photo2X = cardX + cardW - 150 - photoSize;
    const photoY = cardY + (cardH - photoSize) / 2;

    // Carregar e desenhar primeira foto
    try {
      const response1 = await fetch(user1);
      if (response1.ok) {
        const buffer1 = Buffer.from(await response1.arrayBuffer());
        const img1 = await loadImage(buffer1);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(photo1X + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img1, photo1X, photoY, photoSize, photoSize);
        ctx.restore();
      }
    } catch (e) {
      // Fallback para primeira foto
      ctx.save();
      ctx.beginPath();
      ctx.arc(photo1X + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(photo1X, photoY, photoSize, photoSize);
      
      ctx.fillStyle = "#fff";
      ctx.font = "bold 120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", photo1X + photoRadius, photoY + photoRadius);
      ctx.restore();
    }

    // Carregar e desenhar segunda foto
    try {
      const response2 = await fetch(user2);
      if (response2.ok) {
        const buffer2 = Buffer.from(await response2.arrayBuffer());
        const img2 = await loadImage(buffer2);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(photo2X + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img2, photo2X, photoY, photoSize, photoSize);
        ctx.restore();
      }
    } catch (e) {
      // Fallback para segunda foto
      ctx.save();
      ctx.beginPath();
      ctx.arc(photo2X + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(photo2X, photoY, photoSize, photoSize);
      
      ctx.fillStyle = "#fff";
      ctx.font = "bold 120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", photo2X + photoRadius, photoY + photoRadius);
      ctx.restore();
    }

    // CORAÇÃO ATUALIZADO - posição, tamanho e cor
    // Calcular posição exata no meio entre as duas fotos
    const photo1CenterX = photo1X + photoRadius;
    const photo2CenterX = photo2X + photoRadius;
    const heartX = (photo1CenterX + photo2CenterX) / 2;
    const heartY = photoY + photoRadius; // Mesma altura vertical das fotos
    
    // Tamanho menor para encaixar entre as fotos
    const heartSize = 100; // Reduzido de 180 para 100
    
    // Cor pastel (rosa pastel)
    ctx.fillStyle = '#ffb6c1'; // Rosa pastel
    
    ctx.save();
    ctx.translate(heartX, heartY);
    ctx.scale(heartSize / 100, heartSize / 100);
    
    // Desenhar coração
    ctx.beginPath();
    ctx.moveTo(75, 40);
    ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
    ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
    ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
    ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
    ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
    ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
    ctx.fill();
    
    ctx.restore();

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro ao gerar imagem do casal:", e);
    res.status(500).json({ error: "Erro ao gerar imagem", message: e.message });
  }
}
