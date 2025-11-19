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

    const W = 800;
    const H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Fundo gradiente suave
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#ffe6f2');
    gradient.addColorStop(1, '#ffccff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Tamanho das fotos
    const photoSize = 150;
    const photoRadius = 75;

    // Posições das fotos
    const photo1X = 150;
    const photo2X = W - 150 - photoSize;
    const photoY = (H - photoSize) / 2;

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
      ctx.fillStyle = '#ff9999';
      ctx.fillRect(photo1X, photoY, photoSize, photoSize);
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
      ctx.fillStyle = '#9999ff';
      ctx.fillRect(photo2X, photoY, photoSize, photoSize);
      ctx.restore();
    }

    // Coração vermelho no meio
    const heartX = W / 2;
    const heartY = H / 2;
    const heartSize = 40;

    ctx.fillStyle = '#ff0000';
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
