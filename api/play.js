import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) { }

// --- FUNÇÕES DE DESENHO UI ---

/**
 * Desenha um fundo circular com efeito "Glassmorphism" (Blur + Dark Overlay)
 * Para o blur funcionar e alinhar, precisamos redesenhar a imagem de fundo recortada
 */
function drawGlassCircle(ctx, centerX, centerY, radius, bgImg, bgRect) {
  ctx.save();
  
  // 1. Cria a máscara circular
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Desenha o fundo borrado (Se tiver imagem)
  if (bgImg) {
    ctx.filter = 'blur(25px)'; // Blur pesado solicitado
    // Usa as mesmas coordenadas da imagem de fundo principal para alinhar perfeitamente
    ctx.drawImage(bgImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }

  // 3. Camada escura por cima (Tint)
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; // Ajuste a opacidade aqui
  ctx.fill();

  ctx.restore();
}

/**
 * Desenha o ícone de Play perfeitamente centralizado visualmente
 */
function drawPlayIcon(ctx, x, y, size) {
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  // O "centro visual" do triângulo é diferente do centro matemático.
  // Movemos levemente para a direita (+size/8) para parecer centralizado no círculo.
  const visualOffset = size / 8;
  
  ctx.moveTo(x - size / 2 + visualOffset, y - size / 2);
  ctx.lineTo(x + size / 2 + visualOffset, y);
  ctx.lineTo(x - size / 2 + visualOffset, y + size / 2);
  ctx.fill();
}

/**
 * Desenha ícones de Avançar/Voltar (Barra + Triângulos)
 * direction: 1 para avançar (direita), -1 para voltar (esquerda)
 */
function drawSkipIcon(ctx, x, y, size, direction) {
  ctx.fillStyle = '#FFFFFF';
  const barWidth = size * 0.15; // Espessura da barra
  const triangleSize = size * 0.5; // Tamanho de cada triângulo
  
  ctx.save();
  ctx.translate(x, y);
  
  // Se for voltar (esquerda), espelhamos o canvas horizontalmente
  if (direction === -1) {
    ctx.scale(-1, 1);
  }

  // Desenhamos como se fosse "Avançar" (>>|), o scale cuida do inverter

  // 1. Barra Vertical (na ponta direita)
  // Posicionada na borda direita da área do ícone
  ctx.fillRect((size/2) - barWidth, -size/2, barWidth, size);

  // 2. Triângulo da direita (perto da barra)
  // Ponta encosta na barra
  const t1X = (size/2) - barWidth - 2; 
  ctx.beginPath();
  ctx.moveTo(t1X, 0); 
  ctx.lineTo(t1X - triangleSize, -size/2);
  ctx.lineTo(t1X - triangleSize, size/2);
  ctx.fill();

  // 3. Triângulo da esquerda (atrás do primeiro)
  // Começa onde o anterior termina (com um pequeno gap ou overlap)
  const t2X = t1X - triangleSize + 5; // +5 para um leve overlap visual (tight tracking)
  ctx.beginPath();
  ctx.moveTo(t2X, 0);
  ctx.lineTo(t2X - triangleSize, -size/2);
  ctx.lineTo(t2X - triangleSize, size/2);
  ctx.fill();

  ctx.restore();
}


// --- HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ==========================================
    // CONFIGURAÇÕES DE LAYOUT (Ajuste fino aqui)
    // ==========================================
    const W = 1080; 
    const H = 1080;
    const PADDING = 90;
    const CARD_RADIUS = 120;
    
    // Configurações dos BOTÕES DE CONTROLE
    // Aumentei o espaçamento para "respirar" mais
    const CONTROLS_Y_BOTTOM = 140; // Distância do chão
    const CONTROLS_GAP = 260; // Distância entre o centro do Play e os laterais

    const PLAY_BTN_RADIUS = 110; // Tamanho do círculo do Play (fundo)
    const SIDE_BTN_RADIUS = 80;  // Tamanho dos círculos laterais (menores que o play)

    const PLAY_ICON_SIZE = 70;   // Tamanho do desenho do triângulo (menor, mais elegante)
    const SIDE_ICON_SIZE = 40;   // Tamanho dos desenhos das setas (menor)

    // Configurações da BARRA
    const PROGRESS_Y_BOTTOM = 360; // Altura da barra
    const TIME_SIZE = 48; // Tamanho da fonte do tempo

    // Configurações de IMAGEM
    const BG_ZOOM = 1.9; // Zoom bem fechado na imagem
    // ==========================================

    const {
      channel = "Terence Howard",
      handle = "@terenceh",
      thumbnail = "https://i.scdn.co/image/ab67616d0000b273b5f0709d2243e8cb9e623d61",
      totalTime = "2:13"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. Carregar e Preparar Imagem
    let img = null;
    try {
        if(thumbnail && thumbnail.startsWith('http')) {
             const response = await fetch(thumbnail);
             const buf = Buffer.from(await response.arrayBuffer());
             img = await loadImage(buf);
        }
    } catch (e) { console.log("Erro img fallback"); }

    // 2. Fundo Principal
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    // Objeto para guardar as coordenadas exatas de como a imagem foi desenhada
    // Isso é CRUCIAL para o efeito de blur dos botões funcionar
    let bgRect = { x: 0, y: 0, w: W, h: H };

    if (img) {
        const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM;
        bgRect.w = img.width * scale;
        bgRect.h = img.height * scale;
        bgRect.x = (W - bgRect.w) / 2;
        bgRect.y = (H - bgRect.h) / 2;
        
        ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0,0,W,H);
    }

    // Overlay Escuro (Gradient) - Essencial para leitura
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)'); // Base bem escura
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // ==========================================
    // 3. Header (Código simplificado para focar no rodapé)
    // ==========================================
    // (Mantido similar ao anterior, mas com ajustes menores)
    const headerH = 150;
    const glassFill = 'rgba(50, 50, 50, 0.6)'; // Vidro mais simples para o topo
    
    // Cápsula Usuário
    ctx.fillStyle = glassFill;
    ctx.beginPath();
    ctx.roundRect(PADDING, PADDING, W - PADDING*2 - headerH*2.2, headerH, headerH/2);
    ctx.fill();
    
    // Avatar
    const avSize = 110;
    const avY = PADDING + (headerH - avSize)/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(PADDING + 20 + avSize/2, avY + avSize/2, avSize/2, 0, Math.PI*2);
    ctx.clip();
    if(img) ctx.drawImage(img, PADDING+20, avY, avSize, avSize); // Avatar simples
    else { ctx.fillStyle='#fff'; ctx.fill(); }
    ctx.restore();

    // Textos
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText(channel.substring(0,15), PADDING + avSize + 40, PADDING + headerH/2 - 5);
    ctx.fillStyle = '#ccc';
    ctx.font = '400 32px Inter, sans-serif';
    ctx.fillText(handle.substring(0,15), PADDING + avSize + 40, PADDING + headerH/2 + 35);

    // Botões Topo (Like/Share) - Apenas círculos simples para compor
    const btnTopY = PADDING + headerH/2;
    const likeX = W - PADDING - headerH/2;
    const shareX = likeX - headerH - 20;
    
    [likeX, shareX].forEach(bx => {
        ctx.fillStyle = glassFill;
        ctx.beginPath();
        ctx.arc(bx, btnTopY, headerH/2, 0, Math.PI*2);
        ctx.fill();
    });
    // Ícones Topo (Simplificados para focar no pedido principal)
    ctx.font = '40px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('❤', likeX, btnTopY + 2);
    ctx.fillText('⬆', shareX, btnTopY); // Share genérico


    // ==========================================
    // 4. PROGRESS BAR (Ajustada)
    // ==========================================
    const pY = H - PROGRESS_Y_BOTTOM;
    const pW = W - PADDING * 2;
    const ratio = 0.4; // Fixo para demo

    // Tempos
    ctx.font = `500 ${TIME_SIZE}px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'alphabetic';
    
    // Alinhamento exato com o começo e fim da barra
    ctx.textAlign = 'left';
    ctx.fillText("0:52", PADDING, pY - 25);
    
    ctx.textAlign = 'right';
    ctx.fillText("-1:21", W - PADDING, pY - 25);

    // Barra Fundo
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(PADDING, pY, pW, 10, 5);
    ctx.fill();

    // Barra Cheia
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(PADDING, pY, pW * ratio, 10, 5);
    ctx.fill();


    // ==========================================
    // 5. CONTROLES ALINHADOS + BLUR PESADO
    // ==========================================
    const cY = H - CONTROLS_Y_BOTTOM; // Centro Y dos controles
    const cX = W / 2;                 // Centro X (Play)
    const lX = cX - CONTROLS_GAP;     // Centro X (Rewind)
    const rX = cX + CONTROLS_GAP;     // Centro X (Forward)

    // --- A. DESENHAR OS FUNDOS COM BLUR ---
    // Passamos bgRect para que o blur "copie" o pedaço certo da imagem
    
    // 1. Esquerda (Rewind)
    drawGlassCircle(ctx, lX, cY, SIDE_BTN_RADIUS, img, bgRect);
    
    // 2. Centro (Play) - Maior
    drawGlassCircle(ctx, cX, cY, PLAY_BTN_RADIUS, img, bgRect);
    
    // 3. Direita (Forward)
    drawGlassCircle(ctx, rX, cY, SIDE_BTN_RADIUS, img, bgRect);


    // --- B. DESENHAR OS ÍCONES GEOMÉTRICOS ---
    // Agora desenhamos os ícones brancos limpos por cima
    
    // Rewind (<<)
    drawSkipIcon(ctx, lX, cY, SIDE_ICON_SIZE, -1);

    // Play (Triângulo)
    drawPlayIcon(ctx, cX, cY, PLAY_ICON_SIZE);

    // Forward (>>)
    drawSkipIcon(ctx, rX, cY, SIDE_ICON_SIZE, 1);


    // Finaliza
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro");
  }
}
