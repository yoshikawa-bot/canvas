import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CARREGAMENTO DE FONTES (Igual ao código de Música que funciona) ---
try {
  // Ajuste o caminho conforme sua estrutura de pastas real
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) { 
  console.log("Erro ao carregar fonte:", e);
}

// --- 2. FUNÇÕES AUXILIARES DE DESENHO (Reutilizadas do Music Canvas) ---

// Efeito de Vidro em Retângulo (Pílula)
function drawGlassRect(ctx, x, y, w, h, radius, bgImg, bgRect) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(20px)';
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; // Um pouco mais escuro para leitura
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Efeito de Vidro em Círculo (Avatar)
function drawGlassCircle(ctx, centerX, centerY, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// --- 3. ÍCONES VETORIAIS PARA O PERFIL ---

// Ícone de Coroa (Rank)
function drawCrownIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFD700'; // Dourado
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(-s, s * 0.5); // Base esq
  ctx.lineTo(s, s * 0.5);  // Base dir
  ctx.lineTo(s, -s * 0.2); // Ponta dir
  ctx.lineTo(s * 0.4, 0);  // Vale dir
  ctx.lineTo(0, -s);       // Ponta central
  ctx.lineTo(-s * 0.4, 0); // Vale esq
  ctx.lineTo(-s, -s * 0.2); // Ponta esq
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Ícone de ID Card
function drawIDIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  const w = size * 0.8;
  const h = size * 0.6;
  ctx.strokeRect(-w/2, -h/2, w, h);
  // Linhas internas simulando texto
  ctx.beginPath();
  ctx.moveTo(-w/2 + 5, -h/2 + 8);
  ctx.lineTo(-w/2 + 15, -h/2 + 8); // Foto
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w/2 + 20, -h/2 + 5);
  ctx.lineTo(w/2 - 5, -h/2 + 5); // Linha 1
  ctx.moveTo(-w/2 + 20, -h/2 + 12);
  ctx.lineTo(w/2 - 5, -h/2 + 12); // Linha 2
  ctx.stroke();
  ctx.restore();
}

// --- 4. HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Parâmetros (Design estilo "Sticker" igual ao de música)
    const CANVAS_SIZE = 1080;
    const MARGIN = 40; // Margem para o efeito de "adesivo"
    const W = CANVAS_SIZE - (MARGIN * 2);
    const H = CANVAS_SIZE - (MARGIN * 2);
    const CARD_RADIUS = 60;
    
    // Dados da Requisição
    const {
      name = "Yoshikawa",
      username = "@usuario",
      rank = "Admin", 
      pp = "https://i.imgur.com/Te0cnz2.png" 
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // --- CARREGAR IMAGEM ---
    let img = null;
    try {
        const response = await fetch(pp);
        const arrayBuffer = await response.arrayBuffer();
        img = await loadImage(Buffer.from(arrayBuffer));
    } catch (e) {
        console.log("Erro ao carregar imagem, usando fallback cinza");
    }

    // --- FUNDO GERAL (Transparente para ser PNG) ---
    // Movemos o contexto para dentro da margem (Sticker effect)
    ctx.translate(MARGIN, MARGIN);

    // 1. Clipping da Área Principal (Card Arredondado)
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // 2. Desenhar Background (Imagem com Zoom + Blur)
    let bgRect = { x: 0, y: 0, w: W, h: H };
    if (img) {
        const BG_ZOOM = 1.5;
        const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM;
        bgRect.w = img.width * scale;
        bgRect.h = img.height * scale;
        bgRect.x = (W - bgRect.w) / 2;
        bgRect.y = (H - bgRect.h) / 2;
        
        ctx.filter = 'blur(40px)'; // Blur forte no fundo
        ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0,0,W,H);
    }

    // 3. Overlay Escuro (Gradiente) para legibilidade
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // --- LAYOUT DO PERFIL ---
    
    // Constantes de Layout
    const centerX = W / 2;
    const avatarY = 180;
    const avatarSize = 300; // Avatar grande

    // 4. Desenhar Avatar Central
    ctx.save();
    // Sombra do Avatar
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    
    // Círculo da Imagem
    ctx.beginPath();
    ctx.arc(centerX, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
    ctx.clip();
    
    if (img) {
        // Desenha a imagem quadrada preenchendo o círculo
        ctx.drawImage(img, centerX - avatarSize/2, avatarY, avatarSize, avatarSize);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - avatarSize/2, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Borda de Vidro sobre o Avatar
    drawGlassCircle(ctx, centerX, avatarY + avatarSize/2, avatarSize/2);

    // 5. Textos (Nome e User)
    ctx.textAlign = 'center';
    
    // Nome Principal
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 65px Inter, sans-serif'; // Fonte maior
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(name, centerX, avatarY + avatarSize + 90);
    ctx.shadowColor = 'transparent'; // Reset sombra

    // Username / ID (Subtítulo)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '400 35px Inter, sans-serif';
    ctx.fillText(username, centerX, avatarY + avatarSize + 140);

    // 6. Cards de Estatísticas (Glassmorphism)
    // Vamos criar dois "cards" lado a lado ou um grande embaixo
    const statsY = H - 280;
    const cardGap = 40;
    const cardWidth = 380;
    const cardHeight = 160;
    
    // Posições X para centralizar dois cards
    const leftCardX = centerX - cardWidth - (cardGap/2);
    const rightCardX = centerX + (cardGap/2);

    // --- CARD 1: RANK ---
    drawGlassRect(ctx, leftCardX, statsY, cardWidth, cardHeight, 30, img, bgRect);
    drawCrownIcon(ctx, leftCardX + 60, statsY + cardHeight/2, 50);
    
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillText("RANK ATUAL", leftCardX + 110, statsY + 65);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px Inter, sans-serif';
    // Trunca rank longo
    let displayRank = rank;
    if(displayRank.length > 12) displayRank = displayRank.substring(0,12) + "..";
    ctx.fillText(displayRank, leftCardX + 110, statsY + 110);

    // --- CARD 2: ID / INFO ---
    drawGlassRect(ctx, rightCardX, statsY, cardWidth, cardHeight, 30, img, bgRect);
    drawIDIcon(ctx, rightCardX + 60, statsY + cardHeight/2, 50);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillText("IDENTIFICADOR", rightCardX + 110, statsY + 65);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Inter, sans-serif'; // Fonte um pouco menor pro ID
    // O ID geralmente é o username sem o @ ou um numero, vamos limpar
    let displayID = username.replace('@', '');
    if(displayID.length > 14) displayID = displayID.substring(0,14) + "..";
    ctx.fillText(displayID, rightCardX + 110, statsY + 110);

    // Finalizar e Enviar
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração do perfil");
  }
}
