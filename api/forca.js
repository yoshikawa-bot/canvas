import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) {
    GlobalFonts.registerFromPath(fontPath, 'Inter');
  }
} catch (e) {}

function drawGallows(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.5, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h);
  ctx.lineTo(x + w * 0.2, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y);
  ctx.lineTo(x + w * 0.75, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.75, y);
  ctx.lineTo(x + w * 0.75, y + h * 0.14);
  ctx.stroke();

  ctx.restore();
}

function drawBody(ctx, cx, ropeBottom, erros) {
  const headR   = 38;
  const headCY  = ropeBottom + headR;
  const neckBot = headCY + headR;
  const bodyLen = 110;
  const bodyBot = neckBot + bodyLen;
  const armLen  = 72;
  const armY    = neckBot + bodyLen * 0.32;
  const legLen  = 90;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';

  if (erros >= 1) {
    ctx.beginPath();
    ctx.arc(cx, headCY, headR, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (erros >= 2) {
    ctx.beginPath();
    ctx.moveTo(cx, neckBot);
    ctx.lineTo(cx, bodyBot);
    ctx.stroke();
  }

  if (erros >= 3) {
    ctx.beginPath();
    ctx.moveTo(cx, armY);
    ctx.lineTo(cx - armLen, armY + armLen * 0.55);
    ctx.stroke();
  }

  if (erros >= 4) {
    ctx.beginPath();
    ctx.moveTo(cx, armY);
    ctx.lineTo(cx + armLen, armY + armLen * 0.55);
    ctx.stroke();
  }

  if (erros >= 5) {
    ctx.beginPath();
    ctx.moveTo(cx, bodyBot);
    ctx.lineTo(cx - legLen * 0.55, bodyBot + legLen);
    ctx.stroke();
  }

  if (erros >= 6) {
    ctx.beginPath();
    ctx.moveTo(cx, bodyBot);
    ctx.lineTo(cx + legLen * 0.55, bodyBot + legLen);
    ctx.stroke();
  }

  ctx.restore();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let rawErros, rawPalavra, rawLetras, rawTema, rawDica;

    if (req.method === 'POST') {
      rawErros   = req.body?.erros   ?? 0;
      rawPalavra = req.body?.palavra ?? '';
      rawLetras  = req.body?.letras  ?? [];
      rawTema    = req.body?.tema    ?? '';
      rawDica    = req.body?.dica    ?? '';
    } else {
      rawErros   = parseInt(req.query?.erros   ?? '0');
      rawPalavra = req.query?.palavra ?? '';
      rawLetras  = req.query?.letras  ? JSON.parse(req.query.letras) : [];
      rawTema    = req.query?.tema    ?? '';
      rawDica    = req.query?.dica    ?? '';
    }

    const erros  = Math.min(6, Math.max(0, Number(rawErros) || 0));
    const letras = Array.isArray(rawLetras) ? rawLetras.map(l => String(l).toUpperCase()) : [];

    const normalize = (str) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const palavraChars = String(rawPalavra).split('');

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE     = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin            = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES        = 1080;
    const scaleFactor       = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES, H = DESIGN_RES, CARD_RADIUS = 140;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx    = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    const gallowsW = 360;
    const gallowsH = 360;
    const gallowsX = W / 2 - gallowsW / 2 - 40;
    const gallowsY = 90;

    drawGallows(ctx, gallowsX, gallowsY, gallowsW, gallowsH);

    const ropeBottomY = gallowsY + gallowsH * 0.14;
    const bodyX = gallowsX + gallowsW * 0.75;
    drawBody(ctx, bodyX, ropeBottomY, erros);

    const metaY = gallowsY + gallowsH + 60;
    if (rawTema || rawDica) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '500 34px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const metaText = [rawTema && `Tema: ${rawTema}`, rawDica && `Dica: ${rawDica}`].filter(Boolean).join('   •   ');
      ctx.fillText(metaText, W / 2, metaY);
    }

    const wordY   = metaY + 80;
    const charW   = 90;
    const charGap = 16;
    const totalW  = palavraChars.length * charW + (palavraChars.length - 1) * charGap;
    const startX  = (W - totalW) / 2;

    for (let i = 0; i < palavraChars.length; i++) {
      const char    = palavraChars[i];
      const cx      = startX + i * (charW + charGap) + charW / 2;
      const lineY   = wordY + 60;

      if (char === ' ') continue;

      const revealed = letras.includes(normalize(char).toUpperCase()) ||
                       letras.includes(normalize(char));

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.60)';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(cx - charW * 0.42, lineY);
      ctx.lineTo(cx + charW * 0.42, lineY);
      ctx.stroke();

      if (revealed) {
        ctx.fillStyle    = '#ffffff';
        ctx.font         = `bold 58px Inter, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(char.toUpperCase(), cx, lineY - 8);
      }
      ctx.restore();
    }

    const wrongLetters = letras.filter(l => {
      const ln = normalize(l);
      return !palavraChars.some(c => normalize(c) === ln);
    });

    if (wrongLetters.length > 0) {
      const wrongY = wordY + 130;

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '500 30px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Erros', W / 2, wrongY);

      ctx.fillStyle = '#e63946';
      ctx.font = 'bold 40px Inter, sans-serif';
      ctx.fillText(wrongLetters.join('  '), W / 2, wrongY + 48);
    }

    const errBarY  = H - 80;
    const errBarW  = 600;
    const errBarX  = (W - errBarW) / 2;
    const segW     = errBarW / 6;

    for (let i = 0; i < 6; i++) {
      const sx = errBarX + i * segW;
      ctx.fillStyle = i < erros ? '#e63946' : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(sx + 4, errBarY, segW - 8, 14, 7);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${erros} / 6`, W / 2, errBarY + 36);

    ctx.restore();

    const buffer = await canvas.encode('png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);

  } catch (e) {
    console.error(e);
    res.status(500).send('Erro na geração');
  }
               }
