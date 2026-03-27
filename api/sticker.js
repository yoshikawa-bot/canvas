import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) GlobalFonts.registerFromPath(fontPath, 'Inter');
} catch {}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const q = req.method === 'POST' ? req.body ?? {} : req.query;
    const url = q.url ?? '';

    if (!url) return res.status(400).send('Parâmetro "url" obrigatório');

    const FINAL_CANVAS_SIZE = 1080;
    const STICKER_SCALE     = 0.92;
    const stickerActualSize = FINAL_CANVAS_SIZE * STICKER_SCALE;
    const margin            = (FINAL_CANVAS_SIZE - stickerActualSize) / 2;
    const DESIGN_RES        = 1080;
    const scaleFactor       = stickerActualSize / DESIGN_RES;
    const CARD_RADIUS       = 120;

    const W = DESIGN_RES;
    const H = DESIGN_RES;

    const resp = await fetch(url);
    if (!resp.ok) return res.status(400).send('Erro ao buscar imagem');

    const img = await loadImage(Buffer.from(await resp.arrayBuffer()));

    const canvas = createCanvas(FINAL_CANVAS_SIZE, FINAL_CANVAS_SIZE);
    const ctx    = canvas.getContext('2d');

    ctx.save();
    ctx.translate(margin, margin);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, CARD_RADIUS);
    ctx.clip();

    const scale = Math.max(W / img.width, H / img.height);
    const dw    = img.width  * scale;
    const dh    = img.height * scale;
    const dx    = (W - dw) / 2;
    const dy    = (H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);

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
