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

function getInitialBoard() {
  const board = Array(36).fill(null);
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 6; col++)
      if ((row + col) % 2 === 1) board[row * 6 + col] = 'b';
  for (let row = 4; row < 6; row++)
    for (let col = 0; col < 6; col++)
      if ((row + col) % 2 === 1) board[row * 6 + col] = 'r';
  return board;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let rawBoard, rawLastMove;

    if (req.method === 'POST') {
      rawBoard = req.body?.board;
      rawLastMove = req.body?.lastMove ?? null;
    } else {
      rawBoard = req.query?.board ?? null;
      rawLastMove = req.query?.lastMove ?? null;
    }

    let board;
    if (typeof rawBoard === 'string') {
      try { board = JSON.parse(rawBoard); } catch { board = null; }
    } else if (Array.isArray(rawBoard)) {
      board = rawBoard;
    }

    if (!board || !Array.isArray(board) || board.length !== 36) {
      board = getInitialBoard();
    }

    let lastMove = null;
    if (rawLastMove) {
      try {
        lastMove = typeof rawLastMove === 'string' ? JSON.parse(rawLastMove) : rawLastMove;
      } catch { lastMove = null; }
    }

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES = 1080;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES;
    const H = DESIGN_RES;
    const CARD_RADIUS = 120;
    const LABEL_AREA = 90;
    const BOARD_SIZE = W - LABEL_AREA * 2 - 80;
    const BOARD_X = LABEL_AREA + 40;
    const BOARD_Y = LABEL_AREA + 40;
    const CELL = BOARD_SIZE / 6;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(BOARD_X - 4, BOARD_Y - 4, BOARD_SIZE + 8, BOARD_SIZE + 8, 6);
    ctx.fill();
    ctx.restore();

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const x = BOARD_X + col * CELL;
        const y = BOARD_Y + row * CELL;
        const isDark = (row + col) % 2 === 1;
        const idx = row * 6 + col;
        const isFrom = lastMove && lastMove.from === idx;
        const isTo = lastMove && lastMove.to === idx;

        if (isFrom || isTo) {
          ctx.fillStyle = isDark ? 'rgba(230,200,80,0.55)' : 'rgba(230,200,80,0.35)';
        } else {
          ctx.fillStyle = isDark ? '#2a2a2a' : '#e8e0d0';
        }
        ctx.fillRect(x, y, CELL, CELL);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + i * CELL, BOARD_Y);
      ctx.lineTo(BOARD_X + i * CELL, BOARD_Y + BOARD_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + i * CELL);
      ctx.lineTo(BOARD_X + BOARD_SIZE, BOARD_Y + i * CELL);
      ctx.stroke();
    }

    ctx.font = 'bold 52px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.90)';

    for (let col = 0; col < 6; col++) {
      const label = String.fromCharCode(65 + col);
      const x = BOARD_X + col * CELL + CELL / 2;
      ctx.fillText(label, x, BOARD_Y - LABEL_AREA / 2);
      ctx.fillText(label, x, BOARD_Y + BOARD_SIZE + LABEL_AREA / 2);
    }
    for (let row = 0; row < 6; row++) {
      const label = String(6 - row);
      const y = BOARD_Y + row * CELL + CELL / 2;
      ctx.fillText(label, BOARD_X - LABEL_AREA / 2, y);
      ctx.fillText(label, BOARD_X + BOARD_SIZE + LABEL_AREA / 2, y);
    }

    for (let idx = 0; idx < 36; idx++) {
      const piece = board[idx];
      if (!piece) continue;

      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const cx = BOARD_X + col * CELL + CELL / 2;
      const cy = BOARD_Y + row * CELL + CELL / 2;
      const r = CELL * 0.38;

      const isRed = piece === 'r' || piece === 'R';
      const isKing = piece === 'R' || piece === 'B';
      const baseColor = isRed ? '#c0392b' : '#f0f0f0';
      const rimColor = isRed ? '#7b241c' : '#999999';

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
      grad.addColorStop(0, isRed ? 'rgba(255,120,100,0.55)' : 'rgba(255,255,255,0.70)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isRed ? 'rgba(255,180,160,0.35)' : 'rgba(100,100,100,0.40)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      if (isKing) {
        ctx.save();
        ctx.shadowColor = isRed ? '#fff' : '#333';
        ctx.shadowBlur = 8;
        ctx.fillStyle = isRed ? 'rgba(255,255,255,0.95)' : 'rgba(40,40,40,0.95)';
        ctx.font = `bold ${Math.round(r * 0.82)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♛', cx, cy + r * 0.04);
        ctx.restore();
      }
    }

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
