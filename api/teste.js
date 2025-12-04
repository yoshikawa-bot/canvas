import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TENTATIVA DE CARREGAR FONTES ---
try {
  // Ajuste o caminho se necessário.
  // IMPORTANTE: Para renderizar "米塔", você precisa de uma fonte com suporte CJK (Chinês/Japonês).
  // A fonte Inter padrão pode não ter esses glifos. Se ficar quadrado/vazio, instale "Noto Sans CJK" ou similar.
  const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf'); 
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Aviso: Fonte personalizada não carregada. Usando fallback do sistema.");
}

// --- CONFIGURAÇÕES DE ESTILO (FIEL À REFERÊNCIA) ---
const COLORS = {
  bgTop: "#1a0520",       // Roxo muito escuro (topo)
  bgBottom: "#380d40",    // Roxo avermelhado (fundo)
  
  textPinkTitle: "#ff85c2", // Rosa do logo
  textWhite: "#ffffff",
  textGray: "#d1c4d9",      // Texto secundário (Version)
  
  menuButtonBg: "rgba(120, 60, 140, 0.4)", // Roxo translúcido
  menuButtonText: "#ffccee", // Rosa muito claro
  
  statsBg: "rgba(80, 40, 90, 0.3)", // Fundo dos stats (mais escuro)
  statsLabel: "#ebaed8",    // Rosa médio
  statsValue: "#ffffff",
  
  exitButtonBg: "rgba(80, 40, 90, 0.6)",
  
  hearts: "#ff9ec6" // Cor dos corações decorativos
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  try {
    const W = 1280;
    const H = 720;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO (Gradient Dark Purple)
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, COLORS.bgTop);
    gradient.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Adicionar um padrão de grid sutil ou brilho no fundo (opcional, para fidelidade)
    ctx.fillStyle = "rgba(255, 100, 200, 0.03)";
    for(let i=0; i<W; i+=40) {
        ctx.fillRect(i, 0, 1, H);
    }

    // --- POSICIONAMENTO ---
    const marginX = 80;
    let cursorY = 60;

    // 2. HEADER
    // "VERSION 5.0"
    ctx.fillStyle = "#ff5ea3"; // Rosa escuro
    ctx.font = "bold 16px Inter";
    ctx.textAlign = "left";
    ctx.fillText("VERSION 5.0", marginX, cursorY);
    
    cursorY += 70;

    // LOGO "米塔"
    // Nota: Desenhando efeito de brilho para imitar o neon
    ctx.save();
    ctx.shadowColor = "#ff3399";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffb3d9"; // Rosa claro
    ctx.font = "bold 90px Inter"; // Se não renderizar o Kanji, mude a fonte ou o texto
    ctx.fillText("米塔", marginX, cursorY); 
    
    // Decoração no logo (corações/brilhos simples)
    ctx.font = "30px Inter";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("✨", marginX + 160, cursorY - 50);
    ctx.restore();

    cursorY += 60;

    // "MAIN MENU"
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Inter";
    ctx.fillText("MAIN MENU", marginX, cursorY);

    cursorY += 35;

    // 3. MENU LIST (Botões)
    const menuItems = [
      "MENU DOWNLOADS",
      "MENU VIP",
      "MENU NETFLIX",
      "MENU BRINCADEIRAS",
      "MENU ADM",
      "INFO BOT"
    ];

    const btnH = 42;       // Altura do botão
    const btnW = 420;      // Largura do botão
    const btnGap = 12;     // Espaço entre botões
    const cornerRadius = 21; // Metade da altura para ficar totalmente redondo (capsule)

    ctx.font = "bold 20px Inter";
    ctx.textBaseline = "middle";

    menuItems.forEach((text) => {
      // Fundo do botão
      ctx.fillStyle = COLORS.menuButtonBg;
      ctx.beginPath();
      ctx.roundRect(marginX, cursorY, btnW, btnH, cornerRadius);
      ctx.fill();

      // Corações à esquerda
      ctx.fillStyle = "#ffffff"; // Coração branco/rosa claro
      ctx.font = "18px Inter"; // Ícone menor
      ctx.fillText("♥", marginX + 15, cursorY + btnH/2);

      // Texto
      ctx.fillStyle = COLORS.menuButtonText;
      ctx.font = "bold 19px Inter";
      ctx.fillText(text, marginX + 45, cursorY + btnH/2 + 1);

      cursorY += btnH + btnGap;
    });

    // 4. SEPARADOR
    cursorY += 10;
    ctx.strokeStyle = "rgba(255, 112, 184, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, cursorY);
    ctx.lineTo(marginX + btnW, cursorY);
    ctx.stroke();
    cursorY += 25;

    // 5. STATUS / INFO
    // Dados exatos da imagem
    const statsData = [
      { key: "PERSONAGEM", val: "Yoshikawa" },
      { key: "COMANDOS", val: "572" },
      { key: "CRIADOR", val: "@kawalyansky" },
      { key: "IDIOMA", val: "Português" },
      { key: "VOZ", val: "Milenna" }
    ];

    const statH = 38;

    statsData.forEach((item) => {
      // Fundo sutil para cada linha de stats (como na imagem parece ser um bloco único, 
      // mas linhas alternadas ou blocos ficam mais organizados. Vou fazer bloco sólido translúcido)
      ctx.fillStyle = COLORS.statsBg;
      ctx.beginPath();
      ctx.roundRect(marginX, cursorY, btnW, statH, 10); // Raio menor aqui
      ctx.fill();

      // Key (Esquerda)
      ctx.textAlign = "left";
      ctx.fillStyle = COLORS.statsLabel;
      ctx.font = "bold 18px Inter";
      ctx.fillText(item.key, marginX + 15, cursorY + statH/2 + 1);

      // Value (Direita)
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.statsValue;
      ctx.font = "bold 18px Inter";
      ctx.fillText(item.val, marginX + btnW - 15, cursorY + statH/2 + 1);

      cursorY += statH + 8; // Gap menor entre stats
    });

    // Reset textAlign
    ctx.textAlign = "left"; 

    // 6. BOTÃO EXIT
    cursorY += 15;
    const exitW = 140;
    
    ctx.fillStyle = COLORS.exitButtonBg;
    ctx.beginPath();
    ctx.roundRect(marginX, cursorY, exitW, btnH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffb3d9"; // Rosa claro para Exit
    ctx.font = "bold 20px Inter";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", marginX + exitW/2, cursorY + btnH/2 + 1);

    // 7. LADO DIREITO (Vazio por enquanto)
    // Se quiser ver onde ficaria a personagem:
    // ctx.strokeStyle = "red";
    // ctx.strokeRect(W/2, 50, W/2 - 50, H - 100);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro na geração", details: e.message });
  }
  }
