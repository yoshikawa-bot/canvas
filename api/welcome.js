import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) GlobalFonts.registerFromPath(fontPath, 'Inter');
} catch (_) {}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let tmp = text;
  while (ctx.measureText(tmp + '…').width > maxWidth && tmp.length > 1)
    tmp = tmp.slice(0, -1);
  return tmp + '…';
}

function drawPill(ctx, bgImg, x, y, w, h, text, W, H) {

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.clip();
  if (bgImg) {
    const sc = Math.max(W / bgImg.width, H / bgImg.height);
    const pw = bgImg.width * sc, ph = bgImg.height * sc;
    ctx.filter = 'blur(20px)';
    ctx.drawImage(bgImg, (W - pw) / 2, (H - ph) / 2, pw, ph);
    ctx.filter = 'none';
  }
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();

  ctx.font         = 'bold 26px Inter, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.92)';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 28, y + h / 2);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const q = req.method === 'POST' ? req.body : req.query;

    const type     = q?.type     || 'welcome';
    const avatar   = q?.avatar   || '';
    const username = q?.username || 'Usuário';
    const date     = q?.date     || new Date().toLocaleDateString('pt-BR');
    const message  = q?.message  != null
      ? q.message
      : (type === 'welcome' ? 'Leia as regras antes de interagir' : '');

    const FINAL = 1080;
    const SCALE = 0.92;
    const SIZE  = FINAL * SCALE;          // área real do card
    const OFF   = (FINAL - SIZE) / 2;    // margem externa (transparente)
    const D     = 1080;                   // resolução de desenho
    const SF    = SIZE / D;              // scaleFactor

    const W = D, H = D, RADIUS = 140;

    const canvas = createCanvas(FINAL, FINAL);
    const ctx    = canvas.getContext('2d');

    ctx.save();
    ctx.translate(OFF, OFF);
    ctx.scale(SF, SF);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, RADIUS);
    ctx.clip();

    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, W, H);

    let avatarImg = null;
    if (avatar) {
      try {
        const r = await fetch(avatar);
        if (r.ok) avatarImg = await loadImage(Buffer.from(await r.arrayBuffer()));
      } catch (_) {}
    }

    const PAD    = 64;
    const INFO_Y = H - 340;   
    if (avatarImg) {
      const sc = Math.max(W / avatarImg.width, H / avatarImg.height);
      const pw = avatarImg.width * sc, ph = avatarImg.height * sc;
      ctx.filter      = 'blur(36px)';
      ctx.globalAlpha = 0.55;
      ctx.drawImage(avatarImg, (W - pw) / 2, (H - ph) / 2, pw, ph);
      ctx.filter      = 'none';
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, W, H);

    const grd = ctx.createLinearGradient(0, INFO_Y - 280, 0, H);
    grd.addColorStop(0,    'rgba(0,0,0,0)');
    grd.addColorStop(0.25, 'rgba(0,0,0,0.45)');
    grd.addColorStop(0.60, 'rgba(0,0,0,0.72)');
    grd.addColorStop(1,    'rgba(0,0,0,0.92)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    const CR  = 170;                       // raio do círculo
    const CX  = W / 2;
    const CY  = INFO_Y / 2 + 20;          // centralizado na zona superior

    ctx.save();
    ctx.shadowColor  = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur   = 48;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(CX, CY, CR, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, CR, 0, Math.PI * 2);
      ctx.clip();

      const d  = CR * 2;
      const sc = Math.max(d / avatarImg.width, d / avatarImg.height);
      const pw = avatarImg.width * sc, ph = avatarImg.height * sc;
      ctx.drawImage(avatarImg, CX - pw / 2, CY - ph / 2, pw, ph);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, CR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 5;
    ctx.beginPath();
    ctx.arc(CX, CY, CR, 0, Math.PI * 2);
    ctx.stroke();

    const PILL_H = 44;
    const PILL_Y = PAD;

    ctx.font = 'bold 26px Inter, sans-serif';

    const p1Text = 'ESM';
    const p1W    = ctx.measureText(p1Text).width + 56;
    drawPill(ctx, avatarImg, PAD, PILL_Y, p1W, PILL_H, p1Text, W, H);

    const p2Text = type === 'welcome' ? 'YOSHIKAWA WELCOME' : 'YOSHIKAWA GOODBYE';
    const p2W    = ctx.measureText(p2Text).width + 56;
    drawPill(ctx, avatarImg, PAD + p1W + 16, PILL_Y, p2W, PILL_H, p2Text, W, H);

    const titleText = type === 'welcome' ? 'Bem-vindo(a) ao grupo!' : 'Até logo!';
    let titleSize   = 72;
    ctx.font = `bold ${titleSize}px Inter, sans-serif`;
    while (ctx.measureText(titleText).width > W - PAD * 2 && titleSize > 36) {
      titleSize -= 2;
      ctx.font = `bold ${titleSize}px Inter, sans-serif`;
    }
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, PAD, INFO_Y);

    const afterTitle = INFO_Y + titleSize * 1.2 + 16;

    ctx.font         = '500 34px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.65)';
    ctx.textBaseline = 'top';

    const prefix   = `${date}  •  @`;
    const prefixW  = ctx.measureText(prefix).width;
    const nameMaxW = W - PAD * 2 - prefixW;
    const name     = truncateText(ctx, username, nameMaxW);
    ctx.fillText(`${date}  •  @${name}`, PAD, afterTitle);

    const afterInfo = afterTitle + 52;

    if (message) {
      ctx.font         = '500 30px Inter, sans-serif';
      ctx.fillStyle    = 'rgba(255,255,255,0.45)';
      ctx.textBaseline = 'top';
      ctx.fillText(truncateText(ctx, message, W - PAD * 2), PAD, afterInfo);
    }

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader('Content-Type',  'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);

  } catch (e) {
    console.error('[canvas/welcome]', e);
    res.status(500).send('Erro na geração');
  }
}
