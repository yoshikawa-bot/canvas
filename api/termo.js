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

const COLORS = {
  correct: { bg: '#538d4e', text: '#ffffff' },
  present: { bg: '#b59f3b', text: '#ffffff' },
  absent:  { bg: '#3a3a3c', text: '#ffffff' },
  empty:   { bg: '#121213', border: '#3a3a3c', text: '#818384' },
  active:  { bg: '#121213', border: '#565758', text: '#ffffff' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let rawGuesses, rawCurrentRow;

    if (req.method === 'POST') {
      rawGuesses    = req.body?.guesses ?? [];
      rawCurrentRow = req.body?.currentRow ?? 0;
    } else {
      rawGuesses    = req.query?.guesses    ? JSON.parse(req.query.guesses)    : [];
      rawCurrentRow = req.query?.currentRow ? parseInt(req.query.currentRow)   : 0;
    }

    const guesses    = Array.isArray(rawGuesses) ? rawGuesses : [];
    const currentRow = Number.isFinite(rawCurrentRow) ? rawCurrentRow : 0;

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE     = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin            = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES        = 1080;
    const scaleFactor       = stickerActualSize / DESIGN_RES;

    const W = DESIGN_RES, H = DESIGN_RES, CARD_RADIUS = 140;

    const COLS   = 5, ROWS = 6;
    const GAP    = 14;
    const GRID_W = 640;
    const CELL   = (GRID_W - GAP * (COLS - 1)) / COLS;
    const GRID_H = CELL * ROWS + GAP * (ROWS - 1);
    const GRID_X = (W - GRID_W) / 2;
    const GRID_Y = (H - GRID_H) / 2;
    const CELL_RADIUS = 10;

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx    = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    ctx.fillStyle = '#121213';
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = GRID_X + col * (CELL + GAP);
        const y = GRID_Y + row * (CELL + GAP);

        const guess = guesses[row];
        let state  = 'empty';
        let letter = '';

        if (guess) {
          letter = (guess.letters[col] || '').toUpperCase();
          state  = guess.states[col] || 'absent';
        } else if (row === currentRow) {
          state = 'active';
        }

        const c = COLORS[state];

        ctx.save();
        ctx.fillStyle = c.bg;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, CELL_RADIUS);
        ctx.fill();

        if (state === 'empty' || state === 'active') {
          ctx.strokeStyle = c.border;
          ctx.lineWidth   = 4;
          ctx.stroke();
        }
        ctx.restore();

        if (letter) {
          ctx.save();
          ctx.fillStyle      = c.text;
          ctx.font           = `bold ${Math.round(CELL * 0.52)}px Inter, sans-serif`;
          ctx.textAlign      = 'center';
          ctx.textBaseline   = 'middle';
          ctx.fillText(letter, x + CELL / 2, y + CELL / 2);
          ctx.restore();
        }
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
