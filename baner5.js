import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DE FONTES ---
// Tente usar uma fonte arredondada (ex: Fredoka, Varela Round) para ficar idêntico à imagem.
try {
  // Ajuste o caminho conforme sua estrutura de pastas
  const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf'); 
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
  console.log("Fonte não encontrada, usando sistema padrão.");
}

// --- PALETA DE CORES (Baseada na imagem enviada) ---
const COLORS = {
  bgGradientStart: "#2a0e36", // Roxo escuro
  bgGradientEnd: "#150520",   // Quase preto
  textPink: "#ffaad4",        // Rosa claro do título/logo
  textWhite: "#ffffff",
  buttonBg: "rgba(80, 40, 90, 0.5)", // Fundo roxo translúcido dos botões
  buttonText: "#ebbce0",      // Texto dos botões
  highlight: "#ff70b8",       // Rosa choque para destaques
  lineSeparator: "rgba(255, 112, 184, 0.4)"
};

export default async function handler(req, res) {
  // Configuração básica de API (Next.js / Vercel pattern)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  try {
    // Dados recebidos (com valores padrão baseados na imagem)
    const body = req.method === "POST" ? req.body : req.query;
    
    const { 
      characterUrl = "https://i.imgur.com/W8H5vce.png", // URL de uma anime girl padrão
      version = "VERSION 5.0",
      botName = "米塔", // O logo em texto (pode ser imagem também)
      stats = {
        personagem: "Yoshikawa",
        comandos: "572",
        criador: "@kawalyansky",
        idioma: "Português",
        voz: "Milenna"
      }
    } = body;

    // Listas de menus
    const menuItems = [
      "MENU DOWNLOADS",
      "MENU VIP",
      "MENU NETFLIX",
      "MENU BRINCADEIRAS",
      "MENU ADM",
      "INFO BOT"
    ];

    // Dimensões (HD padrão fica bom)
    const W = 1280;
    const H = 720;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO (Background)
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, COLORS.bgGradientStart);
    gradient.addColorStop(1, COLORS.bgGradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Adicionar um brilho radial atrás da personagem (lado direito)
    const glow = ctx.createRadialGradient(W * 0.7, H * 0.5, 50, W * 0.7, H * 0.5, 600);
    glow.addColorStop(0, "rgba(255, 112, 184, 0.15)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // 2. PERSONAGEM (Lado Direito)
    // Tenta carregar a imagem, se falhar, continua sem ela
    try {
      if (characterUrl) {
        const response = await fetch(characterUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const img = await loadImage(buffer);
          
          // Lógica para manter proporção e posicionar na direita
          const imgHeight = H * 0.95; // Ocupa 95% da altura
          const scale = imgHeight / img.height;
          const imgWidth = img.width * scale;
          
          const imgX = W - imgWidth - 50; // 50px de margem da direita
          const imgY = H - imgHeight; // Alinhado ao fundo
          
          // Sombra suave atrás do personagem
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 30;
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
          ctx.restore();
        }
      }
    } catch (e) {
      console.log("Erro ao carregar personagem:", e.message);
    }

    // 3. INTERFACE (Lado Esquerdo)
    const leftMargin = 80;
    let currentY = 50;

    // Versão (Texto pequeno no topo)
    ctx.font = "bold 20px Inter";
    ctx.fillStyle = COLORS.highlight;
    ctx.fillText(version, leftMargin, currentY);
    
    currentY += 80;

    // Logo (Simulado com texto e efeitos)
    ctx.save();
    ctx.shadowColor = COLORS.highlight;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.textPink;
    ctx.font = "bold 90px Inter"; 
    // Dica: Se tiver a imagem da logo, use drawImage aqui ao invés de fillText
    ctx.fillText(botName, leftMargin, currentY);
    
    // Desenhar corações decorativos perto da logo
    ctx.font = "40px Inter";
    ctx.fillText("🍬", leftMargin + 200, currentY - 40);
    ctx.restore();

    currentY += 60;

    // Título "MAIN MENU"
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = "bold 32px Inter";
    ctx.fillText("MAIN MENU", leftMargin, currentY);

    currentY += 40;

    // 4. LISTA DE BOTÕES (Menu Items)
    const buttonHeight = 45;
    const buttonWidth = 450;
    const gap = 15;
    
    ctx.font = "bold 24px Inter";
    ctx.textBaseline = "middle"; // Ajuda a centralizar verticalmente

    menuItems.forEach((item) => {
      // Fundo do botão (Cápsula)
      ctx.fillStyle = COLORS.buttonBg;
      ctx.beginPath();
      ctx.roundRect(leftMargin, currentY, buttonWidth, buttonHeight, 15);
      ctx.fill();

      // Ícone de coraçãozinho à esquerda (decoração)
      ctx.fillStyle = COLORS.textPink;
      ctx.font = "20px Inter";
      ctx.fillText("♥", leftMargin + 15, currentY + buttonHeight/2 + 2);

      // Texto do Botão
      ctx.fillStyle = COLORS.buttonText;
      ctx.font = "bold 22px Inter";
      ctx.fillText(item, leftMargin + 45, currentY + buttonHeight/2 + 2);

      currentY += buttonHeight + gap;
    });

    currentY += 10; // Espaço extra antes da linha

    // 5. SEPARADOR
    ctx.strokeStyle = COLORS.lineSeparator;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftMargin, currentY);
    ctx.lineTo(leftMargin + buttonWidth, currentY);
    ctx.stroke();

    currentY += 35;

    // 6. ESTATÍSTICAS (Stats List)
    const statsKeys = Object.keys(stats);
    
    statsKeys.forEach((key) => {
      const label = key.toUpperCase();
      const value = stats[key];

      // Label (Esquerda)
      ctx.fillStyle = COLORS.buttonText;
      ctx.textAlign = "left";
      ctx.font = "bold 22px Inter";
      ctx.fillText(label, leftMargin, currentY);

      // Value (Direita)
      ctx.fillStyle = COLORS.textWhite;
      ctx.textAlign = "right";
      ctx.fillText(value, leftMargin + buttonWidth, currentY);

      // Resetar alinhamento para o loop
      ctx.textAlign = "left";
      currentY += 35;
    });

    // 7. BOTÃO EXIT (Fundo)
    currentY += 20;
    ctx.fillStyle = "rgba(80, 40, 90, 0.8)"; // Um pouco mais escuro
    ctx.beginPath();
    ctx.roundRect(leftMargin, currentY, 150, buttonHeight, 15);
    ctx.fill();

    ctx.fillStyle = COLORS.textWhite;
    ctx.textAlign = "center";
    ctx.font = "bold 22px Inter";
    ctx.fillText("EXIT", leftMargin + 75, currentY + buttonHeight/2 + 2);

    // Retornar imagem
    const buffer = canvas.toBuffer('image/png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error("Erro:", e);
    res.status(500).json({ error: "Erro ao gerar menu", details: e.message });
  }
}
