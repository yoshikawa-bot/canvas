import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';

// Função auxiliar para desenhar retângulos arredondados (pílulas do menu)
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.closePath();
}

// Função auxiliar para desenhar o ícone de coração (decoração)
function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size; 
  ctx.moveTo(0, s * 0.3); 
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s * 1, s * 0.2, 0, s * 1);
  ctx.bezierCurveTo(s * 1, s * 0.2, s * 0.5, -s * 0.3, 0, s * 0.3);
  ctx.fill();
  ctx.restore();
}

// Função para desenhar ícone de tradução/letra (o 'A' com kanji)
function drawLangIcon(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#ecaebd'; // Rosa claro
    ctx.lineWidth = 2;
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = '#ecaebd';
    ctx.fillText("A", 0, size);
    ctx.font = `${size * 0.6}px Arial`;
    ctx.fillText("あ", size * 0.6, size * 0.6);
    ctx.restore();
}

export default async function handler(req, res) {
  // Configuração para simular ambiente de API (se necessário)
  if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader("Content-Type", "image/png");
  }

  try {
    // 1. Configuração do Canvas (Landscape 16:10 approx para caber a UI)
    const W = 1200;
    const H = 780;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Registrar fonte (Fallback para Arial se Inter não existir, mas idealmente use Inter Bold)
    // O sistema usará a fonte padrão do sistema se não carregar, configuramos 'sans-serif' como fallback visual.
    const fontPrimary = 'sans-serif'; 

    // --- CARREGAMENTO DE IMAGENS ---
    // Usamos as URLs fornecidas
    const bgUrl = "https://yoshikawa-bot.github.io/cache/images/d998aed2.jpg";
    const charUrl = "https://yoshikawa-bot.github.io/cache/images/717371a8.png";
    const logoUrl = "https://yoshikawa-bot.github.io/cache/images/4b8be4b4.png";

    const [bgImage, charImage, logoImage] = await Promise.all([
        loadImage(bgUrl),
        loadImage(charUrl),
        loadImage(logoUrl)
    ]);

    // 2. Fundo (Background)
    // Desenha a imagem de fundo preenchendo tudo
    const bgScale = Math.max(W / bgImage.width, H / bgImage.height);
    const bgW = bgImage.width * bgScale;
    const bgH = bgImage.height * bgScale;
    ctx.drawImage(bgImage, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);

    // 3. Overlay Escuro (Atmosfera Roxa/Preta)
    // A imagem original é bem escura, aplicamos um gradiente forte
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, 'rgba(20, 0, 20, 0.85)');   // Topo escuro
    gradient.addColorStop(0.5, 'rgba(30, 0, 40, 0.85)'); // Meio
    gradient.addColorStop(1, 'rgba(20, 0, 30, 0.95)');   // Base quase preta
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Vignette (bordas mais escuras)
    const radialGrad = ctx.createRadialGradient(W/2, H/2, H/3, W/2, H/2, W);
    radialGrad.addColorStop(0, 'rgba(0,0,0,0)');
    radialGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0,0,W,H);

    // 4. Personagem (Lado Direito)
    // Posicionamento preciso baseado no olhar da personagem na print
    const charScale = 1.1; // Um pouco maior que o original para dar close
    const charW = charImage.width * charScale;
    const charH = charImage.height * charScale;
    const charX = W - charW + 80; // Encostado na direita
    const charY = H - charH + 50; // Alinhado em baixo
    ctx.drawImage(charImage, charX, charY, charW, charH);

    // 5. Interface - Lado Esquerdo
    const marginLeft = 80;

    // --- Header / Logo ---
    // "VERSION 7.0"
    ctx.fillStyle = '#ff66aa'; // Rosa neon forte
    ctx.font = `bold 14px ${fontPrimary}`;
    ctx.textAlign = 'left';
    ctx.fillText('VERSION 7.0', marginLeft, 85);

    // Logo Chinês
    const logoScale = 0.8;
    const logoW = logoImage.width * logoScale;
    const logoH = logoImage.height * logoScale;
    ctx.drawImage(logoImage, marginLeft - 10, 95, logoW, logoH);

    // "MAIN MENU" e Corações
    const menuStartY = 240;
    
    // Ícone de corações decorativos à esquerda do título
    drawHeart(ctx, marginLeft - 25, menuStartY - 15, 12, '#ffccdd');
    drawHeart(ctx, marginLeft - 10, menuStartY - 5, 8, '#ffccdd');

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 24px ${fontPrimary}`; // Extra Bold
    ctx.fillText('MAIN MENU', marginLeft, menuStartY);

    // --- Lista de Botões (Menu) ---
    const buttons = [
        "MENU DOWNLOADS",
        "MENU VIP",
        "MENU NETFLIX",
        "MENU BRINCADEIRAS",
        "MENU ADM",
        "INFO BOT"
    ];

    const btnH = 42;
    const btnW = 380;
    const btnGap = 12;
    let currentY = menuStartY + 30;

    ctx.font = `bold 18px ${fontPrimary}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    buttons.forEach((text) => {
        // Fundo do botão (Roxo translúcido)
        drawRoundedRect(ctx, marginLeft, currentY, btnW, btnH, 10, 'rgba(80, 50, 90, 0.45)');
        
        // Texto do botão
        ctx.fillStyle = '#ebd5eb'; // Lilás bem claro, quase branco
        ctx.fillText(text, marginLeft + 20, currentY + btnH/2 + 2); // +2 ajuste visual da fonte
        
        currentY += btnH + btnGap;
    });

    // --- Seção de Informações (Footer) ---
    // Estrutura: Label (Rosa/Lilás) ...... Valor (Branco/Rosa Claro)
    const infoStartY = currentY + 20;
    const infoLineH = 32;
    const infoLabelX = marginLeft;
    const infoValueX = marginLeft + 370; // Alinhado à direita da caixa do menu

    const infoData = [
        { label: "PERSONAGEM", value: "Yoshikawa" },
        { label: "COMANDOS", value: "343" },
        { label: "CRIADOR", value: "@kawalyansky" },
        { label: "IDIOMA", value: "Português", icon: true }, // Flag para ícone
        { label: "VOZ", value: "Milenna" }
    ];

    infoData.forEach((item, index) => {
        const yPos = infoStartY + (index * infoLineH);

        // Label (Esquerda)
        ctx.font = `bold 16px ${fontPrimary}`;
        ctx.fillStyle = '#eebbdd'; // Rosa pastel
        ctx.textAlign = 'left';
        
        // Se tiver ícone (Idioma)
        if (item.icon) {
            drawLangIcon(ctx, infoLabelX - 30, yPos + 5, 14);
        }
        ctx.fillText(item.label, infoLabelX, yPos);

        // Valor (Direita)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.value, infoValueX, yPos);
    });

    // --- Botão EXIT ---
    const exitY = H - 80;
    drawRoundedRect(ctx, marginLeft, exitY, 120, 45, 15, 'rgba(80, 50, 90, 0.45)');
    ctx.fillStyle = '#ebd5eb';
    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${fontPrimary}`;
    ctx.fillText("EXIT", marginLeft + 60, exitY + 22 + 2);

    // 6. Moldura Preta Arredondada (Efeito de Tela de Celular/App)
    // Simula o border-radius da imagem original cortando as pontas
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 60); // Raio grande nas bordas da tela
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 7. Output
    const buffer = await canvas.encode('png');
    
    // Se estiver rodando como API (Next.js/Express)
    if (res && typeof res.send === 'function') {
        res.send(buffer);
    } else {
        // Se for script standalone, apenas retorna o buffer
        return buffer;
    }

  } catch (e) {
    console.error("Erro ao gerar canvas:", e);
    if (res && typeof res.status === 'function') res.status(500).send("Erro interno");
  }
}
