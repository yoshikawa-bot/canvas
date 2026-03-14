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

function drawX(ctx, cx, cy, r, highlight) {
  const color = highlight ? '#ff6b6b' : '#e63946';
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = highlight ? 40 : 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = highlight ? 22 : 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
  ctx.restore();
}

function drawO(ctx, cx, cy, r, highlight) {
  const color = highlight ? '#74c7ec' : '#4dabf7';
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = highlight ? 40 : 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = highlight ? 22 : 18;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let rawBoard, rawWin;

    if (req.method === 'POST') {
      rawBoard = req.body?.board;
      rawWin = req.body?.win ?? null;
    } else {
      rawBoard = req.query?.board ?? null;
      rawWin = req.query?.win ?? null;
    }

    let board;
    if (Array.isArray(rawBoard)) {
      board = rawBoard.map(c => (c === 'X' || c === 'O') ? c : null);
    } else if (typeof rawBoard === 'string') {
      try {
        const parsed = JSON.parse(rawBoard);
        if (Array.isArray(parsed)) {
          board = parsed.map(c => (c === 'X' || c === 'O') ? c : null);
        } else {
          throw new Error();
        }
      } catch {
        const s = rawBoard.padEnd(9, '_');
        board = Array.from({ length: 9 }, (_, i) => {
          const c = s[i];
          return (c === 'X' || c === 'O') ? c : null;
        });
      }
    } else {
      board = Array(9).fill(null);
    }

    while (board.length < 9) board.push(null);
    board = board.slice(0, 9);

    let winLine = null;
    if (rawWin) {
      if (Array.isArray(rawWin)) {
        winLine = rawWin.map(Number).filter(n => !isNaN(n));
      } else if (typeof rawWin === 'string') {
        winLine = rawWin.split(',').map(Number).filter(n => !isNaN(n));
      }
      if (winLine && winLine.length !== 3) winLine = null;
    }

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES = 1080;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES;
    const H = DESIGN_RES;
    const CARD_RADIUS = 80;

    const GRID_SIZE = 780;
    const GRID_X = (W - GRID_SIZE) / 2;
    const GRID_Y = (H - GRID_SIZE) / 2;
    const CELL = GRID_SIZE / 3;
    const LINE_W = 8;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

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
    vignette.addColorStop(1, 'rgba(0,0,0,0.60)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = LINE_W;
    ctx.lineCap = 'round';

    for (let i = 1; i < 3; i++) {
      const x = GRID_X + CELL * i;
      ctx.beginPath();
      ctx.moveTo(x, GRID_Y + 24);
      ctx.lineTo(x, GRID_Y + GRID_SIZE - 24);
      ctx.stroke();
    }

    for (let i = 1; i < 3; i++) {
      const y = GRID_Y + CELL * i;
      ctx.beginPath();
      ctx.moveTo(GRID_X + 24, y);
      ctx.lineTo(GRID_X + GRID_SIZE - 24, y);
      ctx.stroke();
    }

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = GRID_X + CELL * col + CELL / 2;
      const cy = GRID_Y + CELL * row + CELL / 2;
      const isWin = winLine ? winLine.includes(i) : false;

      if (board[i] === 'X') {
        drawX(ctx, cx, cy, CELL * 0.30, isWin);
      } else if (board[i] === 'O') {
        drawO(ctx, cx, cy, CELL * 0.28, isWin);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.font = 'bold 88px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy);
      }
    }

    if (winLine) {
      const getCenter = (i) => ({
        x: GRID_X + (i % 3) * CELL + CELL / 2,
        y: GRID_Y + Math.floor(i / 3) * CELL + CELL / 2,
      });
      const a = getCenter(winLine[0]);
      const b = getCenter(winLine[2]);

      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 32;
      ctx.strokeStyle = 'rgba(255,255,255,0.90)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowBlur = 60;
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    const footerY = H - 84;
    const footerW = GRID_SIZE;
    const footerX = GRID_X;

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(footerX, footerY - 38, footerW, 76, 38);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const legendCY = footerY;
    const dotR = 12;
    const blockW = 260;
    const blockGap = 60;
    const totalW = blockW * 2 + blockGap;
    const startX = W / 2 - totalW / 2;

    ctx.save();
    ctx.shadowColor = '#e63946';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const xIx = startX + dotR;
    ctx.beginPath(); ctx.moveTo(xIx - dotR * 0.72, legendCY - dotR * 0.72); ctx.lineTo(xIx + dotR * 0.72, legendCY + dotR * 0.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xIx + dotR * 0.72, legendCY - dotR * 0.72); ctx.lineTo(xIx - dotR * 0.72, legendCY + dotR * 0.72); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogador X', xIx + dotR + 16, legendCY);

    const oIx = startX + blockW + blockGap + dotR;

    ctx.save();
    ctx.shadowColor = '#4dabf7';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(oIx, legendCY, dotR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogador O', oIx + dotR + 16, legendCY);

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
