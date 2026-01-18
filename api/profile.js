import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CARREGAMENTO DE FONTES ---
try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) { 
  console.log("Erro ao carregar fonte:", e);
}

// --- 2. FUNÇÃO AUXILIAR (Borda do Avatar) ---
function drawGlassCircle(ctx, centerX, centerY, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; // Borda sutil
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// --- 3. HANDLER PRINCIPAL ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- CONFIGURAÇÃO ESTILO BANNER ---
    const W = 1000;  // Largura
    const H = 300;   // Altura (Horizontal)
    const PADDING = 20; // Margem externa transparente para sombra não cortar (opcional)
    const RADIUS = 80; // Bordas MUITO arredondadas (Estilo Pílula/Apple)

    // Dados da Requisição
    const {
      name = "Yoshikawa",
      username = "999888777", // LID / ID
      pp = "https://i.imgur.com/Te0cnz2.png" 
    } = req.method === "POST" ? req.body : req.query;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // --- CARREGAR IMAGEM ---
    let img = null;
    try {
        const response = await fetch(pp);
        const arrayBuffer = await response.arrayBuffer();
        img = await loadImage(Buffer.from(arrayBuffer));
    } catch (e) {
        console.log("Erro ao carregar imagem, usando fallback");
    }

    // --- DESENHO DO CARD (Corte Arredondado) ---
    // Movemos um pouco para dar espaço se quiser sombra no futuro, ou mantemos full
    // Aqui faremos o card ocupar o canvas todo, mas com cantos transparentes
    
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, RADIUS);
    ctx.clip(); // Tudo desenhado a partir daqui respeita a borda redonda

    // 1. FUNDO (Blur da própria foto)
    if (img) {
        // Zoom na imagem para preencher o fundo sem bordas pretas
        const scale = Math.max(W / img.width, H / img.height) * 1.2;
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (W - w) / 2;
        const y = (H - h) / 2;

        ctx.filter = 'blur(50px)'; // Blur estilo Apple Glass forte
        // Escurecer um pouco a imagem antes de desenhar para o blur ficar "dark mode"
        ctx.drawImage(img, x, y, w, h);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0,0,W,H);
    }

    // 2. OVERLAY (Camada de vidro escuro)
    // Gradiente suave da esquerda para direita
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Adicionar um "Ruído" ou brilho superior para efeito Apple (Opcional, mas dá charme)
    const shine = ctx.createLinearGradient(0, 0, 0, H);
    shine.addColorStop(0, 'rgba(255,255,255,0.1)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, W, H);

    // --- CONTEÚDO ---
    
    const avatarSize = 200;
    const avatarX = 140; // Centro X do avatar
    const avatarY = H / 2; // Centro Y do avatar
    const textAreaX = 280; // Onde começa o texto

    // 3. AVATAR (Círculo à esquerda)
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    if (img) {
        ctx.drawImage(img, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    }
    ctx.restore();
    
    // Borda do Avatar
    drawGlassCircle(ctx, avatarX, avatarY, avatarSize / 2);

    // 4. TEXTOS (Alinhados à esquerda, ao lado da foto)
    ctx.textAlign = 'left';
    
    // NOME (Grande e em destaque)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px Inter, sans-serif';
    // Sombra suave no texto para destacar do fundo blur
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    // Ajuste vertical: Nome um pouco acima do centro
    ctx.fillText(name, textAreaX, H / 2 + 10); 
    
    ctx.shadowColor = 'transparent'; // Limpa sombra para o ID

    // LID / USERNAME (Menor, estilo label)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'; // Cinza claro Apple
    ctx.font = '500 30px Inter, sans-serif';
    
    // Coloca o ID abaixo do nome
    // Vamos desenhar uma pequena "pill" ou apenas o texto
    const idText = `ID: ${username.replace('@', '')}`; // Remove @ se vier, deixa estilo técnico
    ctx.fillText(idText, textAreaX + 5, H / 2 + 60);

    // --- FINALIZAR ---
    const buffer = await canvas.encode('png');
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send("Erro na geração do banner");
  }
}
