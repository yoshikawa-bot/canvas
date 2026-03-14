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
      try {
        board = JSON.parse(rawBoard);
      } catch {
        board = null;
      }
    } else if (Array.isArray(rawBoard)) {
      board = rawBoard;
    }

    if (!board || !Array.isArray(board) || board.length !== 64) {
      board = getInitialBoard();
    }

    let lastMove = null;
    if (rawLastMove) {
      try {
        lastMove = typeof rawLastMove === 'string' ? JSON.parse(rawLastMove) : rawLastMove;
      } catch {
        lastMove = null;
      }
    }

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES = 1080;
    const scaleFactor = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES;
    const H = DESIGN_RES;
    const CARD_RADIUS = 140;

    const BOARD_SIZE = 900;
    const BOARD_X = (W - BOARD_SIZE) / 2;
    const BOARD_Y = (H - BOARD_SIZE) / 2;
    const CELL = BOARD_SIZE / 8;

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

    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.1, W / 2, H / 2, W * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = BOARD_X + col * CELL;
        const y = BOARD_Y + row * CELL;
        const isDark = (row + col) % 2 === 1;

        if (isDark) {
          const idx = row * 8 + col;
          const isLastMoveFrom = lastMove && lastMove.from === idx;
          const isLastMoveTo = lastMove && lastMove.to === idx;

          if (isLastMoveFrom || isLastMoveTo) {
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.055)';
          }
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + i * CELL, BOARD_Y);
      ctx.lineTo(BOARD_X + i * CELL, BOARD_Y + BOARD_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + i * CELL);
      ctx.lineTo(BOARD_X + BOARD_SIZE, BOARD_Y + i * CELL);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = 0; col < 8; col++) {
      const label = String.fromCharCode(65 + col);
      ctx.fillText(label, BOARD_X + col * CELL + CELL / 2, BOARD_Y - 22);
      ctx.fillText(label, BOARD_X + col * CELL + CELL / 2, BOARD_Y + BOARD_SIZE + 22);
    }
    for (let row = 0; row < 8; row++) {
      const label = String(8 - row);
      ctx.fillText(label, BOARD_X - 22, BOARD_Y + row * CELL + CELL / 2);
      ctx.fillText(label, BOARD_X + BOARD_SIZE + 22, BOARD_Y + row * CELL + CELL / 2);
    }

    for (let idx = 0; idx < 64; idx++) {
      const piece = board[idx];
      if (!piece) continue;

      const col = idx % 8;
      const row = Math.floor(idx / 8);
      const cx = BOARD_X + col * CELL + CELL / 2;
      const cy = BOARD_Y + row * CELL + CELL / 2;
      const r = CELL * 0.36;

      const isRed = piece === 'r' || piece === 'R';
      const isKing = piece === 'R' || piece === 'B';

      const color = isRed ? '#e63946' : '#4dabf7';
      const glowColor = isRed ? '#e63946' : '#4dabf7';

      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (isKing) {
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        ctx.font = `bold ${Math.round(r * 0.90)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♛', cx, cy + r * 0.05);
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

function getInitialBoard() {
  const board = Array(64).fill(null);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row * 8 + col] = 'b';
      }
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row * 8 + col] = 'r';
      }
    }
  }
  return board;
}
