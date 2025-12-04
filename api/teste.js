import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CARREGAMENTO DE FONTES ---
try {
  // Tente carregar fontes chinesas/japonesas primeiro para "米塔"
  const cjkFontPath = path.join(__dirname, '../fonts/NotoSansCJK-Bold.ttf');
  if (!GlobalFonts.has('NotoSansCJK')) {
    GlobalFonts.registerFromPath(cjkFontPath, 'NotoSansCJK');
  }
} catch (e) {
  console.log("Aviso: Fonte CJK não carregada, usando fallback para caracteres asiáticos.");
}

try {
  // Fonte para o resto do texto
  const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
  const interRegularPath = path.join(__dirname, '../fonts/Inter-Regular.ttf');
  
  if (!GlobalFonts.has('Inter-Bold')) {
    GlobalFonts.registerFromPath(interFontPath, 'Inter-Bold');
  }
  if (!GlobalFonts.has('Inter-Regular')) {
    GlobalFonts.registerFromPath(interRegularPath, 'Inter-Regular');
  }
} catch (e) {
  console.log("Aviso: Fonte Inter não carregada. Usando fallback do sistema.");
}

// --- CONFIGURAÇÕES DE ESTILO REFINADAS ---
const COLORS = {
  // Gradiente de fundo
  bgTop: "#0d0014",       // Roxo mais escuro (topo)
  bgBottom: "#2a0a30",    // Roxo médio (fundo)
  
  // Textos
  textPinkTitle: "#ff6bb5", // Rosa vibrante
  textWhite: "#ffffff",
  textGray: "#b8a9c0",      // Texto secundário mais suave
  
  // Botões do menu
  menuButtonBg: "rgba(140, 70, 160, 0.35)", // Roxo translúcido
  menuButtonHover: "rgba(160, 90, 180, 0.45)", // Efeito hover
  menuButtonText: "#ffe6f4", // Rosa muito claro
  
  // Stats/Info
  statsBg: "rgba(70, 30, 80, 0.25)", // Fundo translúcido
  statsLabel: "#f0a0d0",    // Rosa médio
  statsValue: "#ffffff",
  
  // Botão Exit
  exitButtonBg: "rgba(100, 40, 110, 0.5)",
  exitButtonHover: "rgba(120, 50, 130, 0.6)",
  
  // Elementos decorativos
  hearts: "#ff9ec6",
  accents: "#ff4da6",
  
  // Bordas e separadores
  border: "rgba(255, 150, 220, 0.2)",
  highlight: "rgba(255, 100, 200, 0.1)"
};

// Função auxiliar para desenhar elementos arredondados
function roundedRect(ctx, x, y, width, height, radius) {
  if (radius > width / 2) radius = width / 2;
  if (radius > height / 2) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  try {
    const W = 1280;
    const H = 720;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO COM GRADIENTE E EFEITOS
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, COLORS.bgTop);
    gradient.addColorStop(0.5, "#1d0525");
    gradient.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Padrão de grid sutil
    ctx.fillStyle = COLORS.highlight;
    for(let i = 0; i < W; i += 60) {
      ctx.fillRect(i, 0, 1, H);
    }
    for(let i = 0; i < H; i += 60) {
      ctx.fillRect(0, i, W, 1);
    }

    // Efeito de brilho radial no centro
    const radialGradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 600);
    radialGradient.addColorStop(0, 'rgba(255, 80, 180, 0.05)');
    radialGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, W, H);

    // --- POSICIONAMENTO PRINCIPAL ---
    const marginX = 80;
    const menuWidth = 420;
    let cursorY = 60;

    // 2. HEADER COM NEON EFFECT
    // "VERSION 5.0"
    ctx.save();
    ctx.shadowColor = '#ff4da6';
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.textPinkTitle;
    ctx.font = 'bold 16px "Inter-Bold"';
    ctx.textAlign = 'left';
    ctx.fillText('VERSION 5.0', marginX, cursorY);
    ctx.restore();

    cursorY += 70;

    // LOGO "米塔" com efeito neon
    ctx.save();
    // Sombra externa (efeito glow)
    ctx.shadowColor = '#ff3399';
    ctx.shadowBlur = 25;
    ctx.fillStyle = COLORS.textPinkTitle;
    // Tente usar fonte CJK, se não disponível use Inter
    try {
      ctx.font = 'bold 96px "NotoSansCJK", "Inter-Bold"';
    } catch {
      ctx.font = 'bold 96px "Inter-Bold"';
    }
    ctx.fillText('米塔', marginX, cursorY);
    
    // Brilho interno
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffb3e6';
    ctx.globalAlpha = 0.6;
    ctx.fillText('米塔', marginX - 2, cursorY - 2);
    ctx.restore();

    // Decorações ao redor do logo
    ctx.fillStyle = COLORS.hearts;
    ctx.font = '32px "Inter-Bold"';
    ctx.fillText('✦', marginX + 200, cursorY - 40);
    ctx.fillText('❀', marginX - 30, cursorY - 10);

    cursorY += 60;

    // "MAIN MENU"
    ctx.save();
    ctx.shadowColor = 'rgba(255, 100, 200, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Inter-Bold"';
    ctx.fillText('MAIN MENU', marginX, cursorY);
    ctx.restore();

    cursorY += 40;

    // 3. MENU LIST - BOTÕES COM EFEITOS
    const menuItems = [
      'MENU DOWNLOADS',
      'MENU VIP',
      'MENU NETFLIX',
      'MENU BRINCADEIRAS',
      'MENU ADM',
      'INFO BOT'
    ];

    const btnHeight = 48;
    const btnGap = 10;
    const cornerRadius = 24;

    menuItems.forEach((text, index) => {
      // Posição Y do botão
      const btnY = cursorY + (index * (btnHeight + btnGap));
      
      // Fundo do botão com gradiente
      const btnGradient = ctx.createLinearGradient(marginX, btnY, marginX, btnY + btnHeight);
      btnGradient.addColorStop(0, COLORS.menuButtonBg);
      btnGradient.addColorStop(1, 'rgba(100, 40, 120, 0.4)');
      
      ctx.fillStyle = btnGradient;
      roundedRect(ctx, marginX, btnY, menuWidth, btnHeight, cornerRadius);
      ctx.fill();

      // Borda sutil
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      roundedRect(ctx, marginX, btnY, menuWidth, btnHeight, cornerRadius);
      ctx.stroke();

      // Efeito de brilho no topo do botão
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      roundedRect(ctx, marginX + 2, btnY + 2, menuWidth - 4, 8, cornerRadius - 2);
      ctx.fill();

      // Ícone de coração
      ctx.fillStyle = COLORS.textPinkTitle;
      ctx.font = '20px "Inter-Bold"';
      ctx.fillText('♥', marginX + 20, btnY + btnHeight/2 + 2);

      // Texto do botão
      ctx.fillStyle = COLORS.menuButtonText;
      ctx.font = 'bold 20px "Inter-Bold"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, marginX + 50, btnY + btnHeight/2 + 2);

      // Indicador de seleção (se fosse interativo)
      if (index === 0) { // Primeiro item como "selecionado"
        ctx.fillStyle = COLORS.textPinkTitle;
        ctx.font = '16px "Inter-Bold"';
        ctx.fillText('▶', marginX + menuWidth - 30, btnY + btnHeight/2 + 2);
      }
    });

    // Atualizar cursorY para após os botões
    cursorY += (menuItems.length * (btnHeight + btnGap)) + 25;

    // 4. SEPARADOR DECORATIVO
    const separatorY = cursorY;
    ctx.save();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(marginX, separatorY);
    ctx.lineTo(marginX + menuWidth, separatorY);
    ctx.stroke();
    ctx.restore();

    // Elementos decorativos no separador
    ctx.fillStyle = COLORS.hearts;
    ctx.font = '18px "Inter-Bold"';
    ctx.fillText('❖', marginX - 10, separatorY + 4);
    ctx.fillText('❖', marginX + menuWidth + 5, separatorY + 4);

    cursorY += 35;

    // 5. STATUS PANEL
    const statsData = [
      { key: 'PERSONAGEM', val: 'Yoshikawa' },
      { key: 'COMANDOS', val: '572' },
      { key: 'CRIADOR', val: '@kawalyansky' },
      { key: 'IDIOMA', val: 'Português' },
      { key: 'VOZ', val: 'Milenna' }
    ];

    const statHeight = 42;
    const statGap = 8;

    // Fundo do painel de stats
    ctx.fillStyle = COLORS.statsBg;
    roundedRect(ctx, marginX, cursorY, menuWidth, 
               (statHeight * statsData.length) + (statGap * (statsData.length - 1)) + 20, 
               12);
    ctx.fill();

    // Borda do painel
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    roundedRect(ctx, marginX, cursorY, menuWidth, 
               (statHeight * statsData.length) + (statGap * (statsData.length - 1)) + 20, 
               12);
    ctx.stroke();

    // Stats individuais
    statsData.forEach((item, index) => {
      const statY = cursorY + 10 + (index * (statHeight + statGap));
      
      // Label (esquerda)
      ctx.fillStyle = COLORS.statsLabel;
      ctx.font = 'bold 18px "Inter-Bold"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.key, marginX + 15, statY + statHeight/2);

      // Separador pontilhado
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 150, 220, 0.3)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(marginX + 180, statY + statHeight/2);
      ctx.lineTo(marginX + menuWidth - 150, statY + statHeight/2);
      ctx.stroke();
      ctx.restore();

      // Value (direita)
      ctx.fillStyle = COLORS.statsValue;
      ctx.font = 'bold 19px "Inter-Bold"';
      ctx.textAlign = 'right';
      ctx.fillText(item.val, marginX + menuWidth - 15, statY + statHeight/2);
    });

    cursorY += (statHeight * statsData.length) + (statGap * (statsData.length - 1)) + 40;

    // 6. BOTÃO EXIT COM EFEITO
    const exitWidth = 150;
    const exitHeight = 52;
    const exitX = marginX;
    const exitY = cursorY;

    // Gradiente do botão exit
    const exitGradient = ctx.createLinearGradient(exitX, exitY, exitX, exitY + exitHeight);
    exitGradient.addColorStop(0, COLORS.exitButtonBg);
    exitGradient.addColorStop(1, 'rgba(80, 30, 90, 0.6)');
    
    ctx.fillStyle = exitGradient;
    roundedRect(ctx, exitX, exitY, exitWidth, exitHeight, 15);
    ctx.fill();

    // Borda com efeito
    ctx.strokeStyle = 'rgba(255, 120, 200, 0.4)';
    ctx.lineWidth = 2;
    roundedRect(ctx, exitX, exitY, exitWidth, exitHeight, 15);
    ctx.stroke();

    // Texto do botão exit
    ctx.fillStyle = '#ffb3e6';
    ctx.font = 'bold 22px "Inter-Bold"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', exitX + exitWidth/2, exitY + exitHeight/2);

    // Ícone no botão exit
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px "Inter-Bold"';
    ctx.fillText('↩', exitX + exitWidth - 25, exitY + exitHeight/2);

    // 7. LADO DIREITO - ESPAÇO PARA PERSONAGEM
    const characterAreaX = marginX + menuWidth + 60;
    const characterAreaY = 80;
    const characterAreaWidth = W - characterAreaX - 80;
    const characterAreaHeight = H - 160;

    // Moldura para área da personagem
    ctx.strokeStyle = 'rgba(255, 100, 200, 0.3)';
    ctx.lineWidth = 2;
    roundedRect(ctx, characterAreaX, characterAreaY, characterAreaWidth, characterAreaHeight, 20);
    ctx.stroke();

    // Gradiente interno da moldura
    const frameGradient = ctx.createLinearGradient(
      characterAreaX, characterAreaY, 
      characterAreaX, characterAreaY + characterAreaHeight
    );
    frameGradient.addColorStop(0, 'rgba(255, 100, 200, 0.05)');
    frameGradient.addColorStop(1, 'rgba(160, 60, 180, 0.05)');
    
    ctx.fillStyle = frameGradient;
    roundedRect(ctx, characterAreaX, characterAreaY, characterAreaWidth, characterAreaHeight, 20);
    ctx.fill();

    // Texto placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'italic 24px "Inter-Regular"';
    ctx.textAlign = 'center';
    ctx.fillText('Character Art Area', 
                characterAreaX + characterAreaWidth/2, 
                characterAreaY + characterAreaHeight/2);

    // 8. ELEMENTOS DECORATIVOS ADICIONAIS
    // Brilhos flutuantes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = Math.random() * 4 + 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bordas externas suaves
    ctx.strokeStyle = 'rgba(255, 100, 200, 0.1)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Gerar e enviar a imagem
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buffer);

  } catch (e) {
    console.error('Erro na geração da imagem:', e);
    res.status(500).json({ 
      error: 'Erro na geração da imagem', 
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
                       }
