import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta registrar a fonte Inter Bold. Se não tiver, o sistema usa uma padrão.
try {
  // Ajuste o caminho da fonte conforme sua estrutura de pastas real
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {
    // console.log('Fonte não encontrada, usando fallback do sistema');
}

// --- Funções Auxiliares de Desenho ---

// Desenha retângulo com cantos arredondados (usado para os fundos "vidro")
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
  ctx.fill();
}

// Desenha o ícone de Coração (Like) usando curvas bezier
function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 0.8, 0, size);
  ctx.bezierCurveTo(0, size * 0.8, size / 2, size / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.fill();
  ctx.restore();
}

// Desenha o ícone de Compartilhar (Quadrado com seta para cima)
function drawShareIcon(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5; // Linha um pouco mais grossa
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const w = size;
  const h = size;
  
  // Caixa (parte de baixo)
  ctx.beginPath();
  ctx.moveTo(x - w/2, y - h/10);
  ctx.lineTo(x - w/2, y + h/2);
  ctx.lineTo(x + w/2, y + h/2);
  ctx.lineTo(x + w/2, y - h/10);
  ctx.stroke();

  // Seta (haste)
  ctx.beginPath();
  ctx.moveTo(x, y + h/5); 
  ctx.lineTo(x, y - h/2); 
  ctx.stroke();

  // Cabeça da seta
  ctx.beginPath();
  ctx.moveTo(x - w/3.5, y - h/5);
  ctx.lineTo(x, y - h/2);
  ctx.lineTo(x + w/3.5, y - h/5);
  ctx.stroke();
  
  ctx.restore();
}

// Trunca texto muito longo com "..."
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + "...").width > maxWidth && tmp.length > 1) {
    tmp = tmp.slice(0, -1);
  }
  return tmp + "...";
}

// Converte string "MM:SS" ou "HH:MM:SS" para segundos totais
function timeToSeconds(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

// Formata segundos de volta para "M:SS"
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}


// --- HANDLER PRINCIPAL ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONFIGURAÇÕES DE LAYOUT (MEDIDAS) ---
    // Ajuste estes valores para mudar o visual
    const W = 1080; // Largura total da imagem
    const H = 1080; // Altura total da imagem
    const PADDING = 90; // (AUMENTADO) Espaçamento das bordas laterais e superior
    const CARD_RADIUS = 140; // (AUMENTADO) Arredondamento dos cantos do card principal
    const BG_ZOOM_FACTOR = 1.8; // (NOVO) Fator de zoom da imagem de fundo (quanto maior, mais zoom)
    const GLASS_COLOR = 'rgba(25, 25, 25, 0.75)'; // Cor dos fundos semi-transparentes (mais escuro)

    // Header (Topo - Perfil e Botões)
    const HEADER_HEIGHT = 160; // Altura das cápsulas superiores
    const AVATAR_SIZE = 120; // Tamanho da foto de perfil redonda

    // Barra de Progresso e Tempos
    const PROGRESS_BAR_HEIGHT = 12; // Espessura da linha da barra
    const PROGRESS_Y_FROM_BOTTOM = 340; // (ABAIXADO) Distância da barra até a base da imagem. Aumente para subir, diminua para descer.
    const TIME_FONT_SIZE = 52; // (AUMENTADO) Tamanho da fonte dos tempos (ex: 0:52)

    // Controles (Parte inferior - Play/Pause)
    const CONTROLS_Y_FROM_BOTTOM = 150; // Distância do centro dos controles até a base da imagem
    const CONTROL_BUTTON_SIZE = 210; // (NOVO) Diâmetro dos círculos de fundo dos controles
    const CONTROL_GAP = 250; // Espaço horizontal entre o centro do Play e os botões laterais
    // -----------------------------------------

    const {
      channel = "Terence Howard",
      handle = "@terenceh",
      // Imagem de exemplo da referência
      thumbnail = "https://i.scdn.co/image/ab67616d0000b273b5f0709d2243e8cb9e623d61", 
      totalTime = "2:13"
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // 1. CARREGAR IMAGEM
    let img = null;
    try {
        if(thumbnail && thumbnail.startsWith('http')) {
             const response = await fetch(thumbnail);
             const buf = Buffer.from(await response.arrayBuffer());
             img = await loadImage(buf);
        }
    } catch (e) {
        console.log("Erro ao carregar imagem, usando fallback de cor sólida");
    }

    // 2. FUNDO (BACKGROUND) COM ZOOM E CORTE
    ctx.beginPath();
    // Cria o formato do card principal
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip(); // Tudo desenhado depois disso ficará dentro desse formato

    if (img) {
      // Calcula a escala para cobrir (cover) e aplica o fator de zoom extra
      const scale = Math.max(W / img.width, H / img.height) * BG_ZOOM_FACTOR;
      // Centraliza a imagem com o novo zoom
      const x = (W - img.width * scale) / 2;
      const y = (H - img.height * scale) / 2;
      // Desenha a imagem com leve desfoque para dar profundidade
      // ctx.filter = 'blur(10px)'; // Opcional: descomente se quiser o fundo borrado
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#222'; // Fallback se não houver imagem
      ctx.fillRect(0,0,W,H);
    }

    // Overlay gradiente para escurecer o fundo e melhorar leitura do texto branco
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, 'rgba(0,0,0,0.2)'); // Topo mais claro
    overlay.addColorStop(0.6, 'rgba(0,0,0,0.5)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.85)'); // Base bem mais escura para os controles
    ctx.fillStyle = overlay;
    ctx.fillRect(0,0,W,H);

    // ==========================================================
    // 3. HEADER "GLASS" (Perfil e botões superiores)
    // ==========================================================
    
    // -- Cápsula do Usuário (Esquerda) --
    const pillX = PADDING;
    const pillY = PADDING;
    const pillWidth = W - (PADDING * 2) - (HEADER_HEIGHT * 2) - 40; // Calcula largura dinâmica deixando espaço para os 2 botões da direita
    const pillRadius = HEADER_HEIGHT / 2;

    // Fundo da cápsula
    ctx.fillStyle = GLASS_COLOR;
    drawRoundedRect(ctx, pillX, pillY, pillWidth, HEADER_HEIGHT, pillRadius);

    // Foto de perfil circular
    const avatarX = pillX + 20;
    const avatarY = pillY + (HEADER_HEIGHT - AVATAR_SIZE)/2;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + AVATAR_SIZE/2, avatarY + AVATAR_SIZE/2, AVATAR_SIZE/2, 0, Math.PI*2);
    ctx.clip();
    if(img) {
        // Usa a mesma imagem do fundo para o avatar
        // Ajuste fino: um leve zoom no avatar pra focar no rosto
        const avScale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height) * 1.2;
        ctx.drawImage(img, avatarX + (AVATAR_SIZE - img.width*avScale)/2, avatarY + (AVATAR_SIZE - img.height*avScale)/2, img.width * avScale, img.height * avScale); 
    } else {
        ctx.fillStyle = '#888';
        ctx.fillRect(avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    // Texto do Usuário
    const textStartX = avatarX + AVATAR_SIZE + 30;
    const maxTextWidth = pillWidth - (textStartX - pillX) - 20;

    ctx.textAlign = 'left';
    
    // Nome (Channel)
    ctx.fillStyle = '#FFFFFF';
    // Tenta usar Inter, se falhar usa sans-serif padrão
    ctx.font = `bold 45px Inter, sans-serif`; 
    ctx.textBaseline = 'bottom';
    ctx.fillText(truncateText(ctx, channel, maxTextWidth), textStartX, pillY + HEADER_HEIGHT/2 - 5);

    // Handle (@...)
    ctx.fillStyle = '#cccccc'; // Cinza claro
    ctx.font = `400 35px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(truncateText(ctx, handle, maxTextWidth), textStartX, pillY + HEADER_HEIGHT/2 + 5);


    // -- Botões Superiores (Direita) --
    const topButtonY = PADDING;
    
    // Botão Like (Coração) - Extrema direita
    const likeX = W - PADDING - HEADER_HEIGHT;
    ctx.fillStyle = GLASS_COLOR;
    ctx.beginPath();
    ctx.arc(likeX + HEADER_HEIGHT/2, topButtonY + HEADER_HEIGHT/2, HEADER_HEIGHT/2, 0, Math.PI*2);
    ctx.fill();
    drawHeart(ctx, likeX + HEADER_HEIGHT/2, topButtonY + HEADER_HEIGHT/2 - 10, 40, '#FFFFFF');

    // Botão Share - À esquerda do Like
    const shareX = likeX - HEADER_HEIGHT - 25; // 25px de espaço entre eles
    ctx.fillStyle = GLASS_COLOR;
    ctx.beginPath();
    ctx.arc(shareX + HEADER_HEIGHT/2, topButtonY + HEADER_HEIGHT/2, HEADER_HEIGHT/2, 0, Math.PI*2);
    ctx.fill();
    drawShareIcon(ctx, shareX + HEADER_HEIGHT/2, topButtonY + HEADER_HEIGHT/2 + 5, 45, '#FFFFFF');


    // ==========================================================
    // 4. PROGRESSO E TEMPOS (Rodapé acima dos controles)
    // ==========================================================
    
    // Cálculo dos tempos (usando 0:52 de 2:13 como referência visual ~40%)
    const ratio = 0.42; 
    const totalSec = timeToSeconds(totalTime);
    const currentSec = Math.floor(totalSec * ratio);
    const remainingSec = totalSec - currentSec;

    const progressY = H - PROGRESS_Y_FROM_BOTTOM;
    const progressX = PADDING;
    const progressWidth = W - (PADDING * 2);

    // Desenho dos Tempos (acima da barra)
    ctx.font = `500 ${TIME_FONT_SIZE}px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'alphabetic'; // Reset baselines
    
    // Tempo atual (esquerda)
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(currentSec), progressX, progressY - 25);
    
    // Tempo restante (direita)
    ctx.textAlign = 'right';
    ctx.fillText(`-${formatTime(remainingSec)}`, progressX + progressWidth, progressY - 25);

    // Fundo da Barra (cinza translúcido)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    drawRoundedRect(ctx, progressX, progressY, progressWidth, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_HEIGHT/2);

    // Barra Preenchida (branca)
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, progressX, progressY, progressWidth * ratio, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_HEIGHT/2);

    // (Bolinha/Knob removida conforme solicitado)


    // ==========================================================
    // 5. CONTROLES DE PLAYBACK (Inferior)
    // ==========================================================
    
    const controlsCenterY = H - CONTROLS_Y_FROM_BOTTOM;
    const centerX = W / 2;
    const rwCenterX = centerX - CONTROL_GAP;
    const fwCenterX = centerX + CONTROL_GAP;

    // --- A. Desenhar os fundos redondos escuros (NOVOS) ---
    ctx.fillStyle = GLASS_COLOR;
    
    // Fundo Rewind (Esquerda)
    ctx.beginPath();
    ctx.arc(rwCenterX, controlsCenterY, CONTROL_BUTTON_SIZE/2, 0, Math.PI*2);
    ctx.fill();

    // Fundo Play (Centro)
    ctx.beginPath();
    ctx.arc(centerX, controlsCenterY, CONTROL_BUTTON_SIZE/2, 0, Math.PI*2);
    ctx.fill();

    // Fundo Forward (Direita)
    ctx.beginPath();
    ctx.arc(fwCenterX, controlsCenterY, CONTROL_BUTTON_SIZE/2, 0, Math.PI*2);
    ctx.fill();


    // --- B. Desenhar os Ícones Brancos por cima ---
    ctx.fillStyle = '#FFFFFF';

    // Ícone Play (Triângulo central grande)
    const playIconSize = 65;
    ctx.beginPath();
    // Ajuste fino de +8 no X para centralizar visualmente o peso do triângulo
    ctx.moveTo(centerX - playIconSize/2 + 8, controlsCenterY - playIconSize);
    ctx.lineTo(centerX + playIconSize + 8, controlsCenterY);
    ctx.lineTo(centerX - playIconSize/2 + 8, controlsCenterY + playIconSize);
    ctx.fill();

    // Ícone Rewind (<< barra)
    const arrowH = 40; // Altura da metade da seta
    const arrowW = 45; // Largura da seta
    const barThickness = 10;
    
    ctx.beginPath();
    // Seta da direita (mais perto do centro)
    ctx.moveTo(rwCenterX + arrowW/2, controlsCenterY);
    ctx.lineTo(rwCenterX + arrowW/2 + arrowW, controlsCenterY - arrowH);
    ctx.lineTo(rwCenterX + arrowW/2 + arrowW, controlsCenterY + arrowH);
    // Seta da esquerda
    ctx.moveTo(rwCenterX - arrowW/2, controlsCenterY);
    ctx.lineTo(rwCenterX + arrowW/2, controlsCenterY - arrowH);
    ctx.lineTo(rwCenterX + arrowW/2, controlsCenterY + arrowH);
    ctx.fill();
    // Barra vertical
    ctx.fillRect(rwCenterX - arrowW/2 - barThickness, controlsCenterY - arrowH, barThickness, arrowH*2);


    // Ícone Forward (>> barra)
    ctx.beginPath();
    // Seta da esquerda (mais perto do centro)
    ctx.moveTo(fwCenterX - arrowW/2, controlsCenterY); 
    ctx.lineTo(fwCenterX - arrowW/2 - arrowW, controlsCenterY - arrowH);
    ctx.lineTo(fwCenterX - arrowW/2 - arrowW, controlsCenterY + arrowH);
    // Seta da direita
    ctx.moveTo(fwCenterX + arrowW/2, controlsCenterY);
    ctx.lineTo(fwCenterX - arrowW/2, controlsCenterY - arrowH);
    ctx.lineTo(fwCenterX - arrowW/2, controlsCenterY + arrowH);
    ctx.fill();
    // Barra vertical
    ctx.fillRect(fwCenterX + arrowW/2, controlsCenterY - arrowH, barThickness, arrowH*2);

    // Finalização e envio
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    // Cache opcional para performance em produção
    // res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30'); 
    res.send(buffer);

  } catch (e) {
    console.error(e);
    // Retorna uma imagem de erro simples em vez de JSON para não quebrar tags <img>
    const errorCanvas = createCanvas(600, 400);
    const errCtx = errorCanvas.getContext('2d');
    errCtx.fillStyle = '#330000'; errCtx.fillRect(0,0,600,400);
    errCtx.fillStyle = 'red'; errCtx.font = '30px sans-serif';
    errCtx.textAlign = 'center';
    errCtx.fillText('Erro ao gerar imagem', 300, 200);
    errCtx.font = '20px sans-serif';
    errCtx.fillText(e.message.substring(0,50), 300, 240);
    res.setHeader("Content-Type", "image/png");
    res.send(await errorCanvas.encode('png'));
  }
}
