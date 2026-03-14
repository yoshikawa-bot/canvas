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
  ctx.shadowBlur = highlight ? 28 : 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = highlight ? 14 : 11;
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
  ctx.shadowBlur = highlight ? 28 : 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = highlight ? 14 : 11;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWinStrike(ctx, winLine, PADDING, CELL) {
  const getCenter = (i) => ({
    x: PADDING + (i % 3) * CELL + CELL / 2,
    y: PADDING + Math.floor(i / 3) * CELL + CELL / 2,
  });
  const a = getCenter(winLine[0]);
  const b = getCenter(winLine[2]);
  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.70)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
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
    const PADDING = 108;
    const GRID_SIZE = W - PADDING * 2;
    const CELL = GRID_SIZE / 3;
    const LINE_W = 10;

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

    const GRID_OFFSET_Y = 60;

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = LINE_W;
    ctx.lineCap = 'round';

    for (let i = 1; i < 3; i++) {
      const x = PADDING + CELL * i;
      ctx.beginPath();
      ctx.moveTo(x, PADDING + GRID_OFFSET_Y + 28);
      ctx.lineTo(x, PADDING + GRID_OFFSET_Y + GRID_SIZE - 28);
      ctx.stroke();
    }

    for (let i = 1; i < 3; i++) {
      const y = PADDING + GRID_OFFSET_Y + CELL * i;
      ctx.beginPath();
      ctx.moveTo(PADDING + 28, y);
      ctx.lineTo(PADDING + GRID_SIZE - 28, y);
      ctx.stroke();
    }

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = PADDING + CELL * col + CELL / 2;
      const cy = PADDING + GRID_OFFSET_Y + CELL * row + CELL / 2;
      const isWin = winLine ? winLine.includes(i) : false;

      if (board[i] === 'X') {
        drawX(ctx, cx, cy, CELL * 0.28, isWin);
      } else if (board[i] === 'O') {
        drawO(ctx, cx, cy, CELL * 0.24, isWin);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.font = 'bold 52px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy);
      }
    }

    if (winLine) {
      const getCenter = (i) => ({
        x: PADDING + (i % 3) * CELL + CELL / 2,
        y: PADDING + GRID_OFFSET_Y + Math.floor(i / 3) * CELL + CELL / 2,
      });
      const a = getCenter(winLine[0]);
      const b = getCenter(winLine[2]);
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(255,255,255,0.70)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    const footerY = H - 100;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(PADDING, footerY - 36, GRID_SIZE, 72, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const legendX = W / 2;
    const legendY = footerY;
    const dotR = 14;
    const gap = 200;

    ctx.save();
    ctx.shadowColor = '#e63946';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const xLx = legendX - gap - dotR;
    ctx.beginPath(); ctx.moveTo(xLx - dotR * 0.7, legendY - dotR * 0.7); ctx.lineTo(xLx + dotR * 0.7, legendY + dotR * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xLx + dotR * 0.7, legendY - dotR * 0.7); ctx.lineTo(xLx - dotR * 0.7, legendY + dotR * 0.7); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 32px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogador X', legendX - gap - dotR + 28, legendY);

    ctx.save();
    ctx.shadowColor = '#4dabf7';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 5;
    const oLx = legendX + gap / 2;
    ctx.beginPath(); ctx.arc(oLx, legendY, dotR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 32px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogador O', oLx + 26, legendY);

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
