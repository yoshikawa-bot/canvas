import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fontPath = path.join(__dirname, '../fonts/Inter_18pt-Bold.ttf');
  if (!GlobalFonts.has('Inter')) GlobalFonts.registerFromPath(fontPath, 'Inter');
} catch {}

const BG_URL = 'https://yoshikawa-bot.github.io/cache/images/f967b450.jpg';
const FALLBACK_AVATAR = 'https://yoshikawa-bot.github.io/cache/images/236744bb.jpg';

async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return loadImage(Buffer.from(await res.arrayBuffer()));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { title = '@username', thumbnail = FALLBACK_AVATAR } =
      req.method === 'POST' ? req.body : req.query;

    const W = 1400;
    const H = 900;
    const MARGIN = 40;
    const RADIUS = 80;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.save();
    roundRect(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, RADIUS);
    ctx.clip();

    try {
      const bg = await fetchImage(BG_URL);
      ctx.drawImage(bg, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);
    } catch {
      ctx.fillStyle = '#0C0C0E';
      ctx.fillRect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);
    }

    ctx.fillStyle = 'rgba(10, 10, 16, 0.72)';
    ctx.fillRect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);

    ctx.restore();

    ctx.save();
    roundRect(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, RADIUS);
    ctx.clip();

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    const radial = ctx.createRadialGradient(W * 0.25, MARGIN, 0, W * 0.25, MARGIN, W * 0.6);
    radial.addColorStop(0, 'rgba(255,255,255,0.06)');
    radial.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);

    ctx.restore();

    const bW = W - MARGIN * 2;
    const bH = H - MARGIN * 2;
    const bX = MARGIN;
    const bY = MARGIN;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bX, bY, bW, bH, RADIUS);
    ctx.stroke();
    ctx.restore();

    const PAD = 100;
    const contentY = bY;
    const contentH = bH;

    const topBarH = 100;
    const topBarY = contentY + 60;

    const appIconSize = 60;
    const appIconX = bX + PAD;
    const appIconY = topBarY + (topBarH - appIconSize) / 2;

    ctx.save();
    roundRect(ctx, appIconX, appIconY, appIconSize, appIconSize, 16);
    ctx.clip();
    const iconGrad = ctx.createLinearGradient(appIconX, appIconY, appIconX + appIconSize, appIconY + appIconSize);
    iconGrad.addColorStop(0, '#FF6B6B');
    iconGrad.addColorStop(1, '#FF8E53');
    ctx.fillStyle = iconGrad;
    ctx.fillRect(appIconX, appIconY, appIconSize, appIconSize);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔔', appIconX + appIconSize / 2, appIconY + appIconSize / 2);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Yoshikawa Bot', appIconX + appIconSize + 22, appIconY + appIconSize / 2);

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = 'bold 30px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('agora', bX + bW - PAD, appIconY + appIconSize / 2);

    const dividerY = topBarY + topBarH + 20;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bX + PAD, dividerY);
    ctx.lineTo(bX + bW - PAD, dividerY);
    ctx.stroke();
    ctx.restore();

    const centerY = dividerY + (contentY + contentH - dividerY) / 2 - 40;

    const avatarSize = 220;
    const avatarX = bX + PAD;
    const avatarY = centerY - avatarSize / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    try {
      const avatarImg = await fetchImage(thumbnail);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const badgeR = 28;
    const badgeCX = avatarX + avatarSize - 14;
    const badgeCY = avatarY + avatarSize - 14;
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,16,0.9)';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34C759';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const textX = avatarX + avatarSize + 80;
    const textMaxW = bX + bW - PAD - textX;

    const labelY = centerY - 120;
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('NOVO MEMBRO', textX, labelY);

    const usernameY = labelY + 95;
    const clampedTitle = truncate(ctx, title, 'bold 80px Inter', textMaxW);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(clampedTitle, textX, usernameY);

    const subtitleY = usernameY + 52;
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = 'bold 34px Inter';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('entrou no grupo', textX, subtitleY);

    const pillsY = subtitleY + 72;
    const pills = [
      { icon: '🛡', label: 'Leia as regras' },
      { icon: '👥', label: 'Bem-vindo(a)' },
      { icon: '✨', label: 'Novo membro' },
    ];

    let pillCursor = textX;
    const pillH = 64;
    const pillR = 18;
    const pillPadX = 30;
    const pillGap = 18;

    ctx.font = 'bold 28px Inter';

    for (const { icon, label } of pills) {
      const textW = ctx.measureText(label).width;
      const iconW = 38;
      const pW = pillPadX + iconW + 14 + textW + pillPadX;

      ctx.save();
      roundRect(ctx, pillCursor, pillsY, pW, pillH, pillR);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.font = 'bold 28px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, pillCursor + pillPadX, pillsY + pillH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.fillText(label, pillCursor + pillPadX + iconW + 14, pillsY + pillH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.62)';

      pillCursor += pW + pillGap;
    }

    const footerDivY = bY + bH - 120;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bX + PAD, footerDivY);
    ctx.lineTo(bX + bW - PAD, footerDivY);
    ctx.stroke();
    ctx.restore();

    const footerY = footerDivY + 55;
    const footerItems = [
      { icon: '#', label: 'Geral' },
      { icon: '🔔', label: 'Avisos' },
      { icon: '⭐', label: 'Destaques' },
    ];

    ctx.font = 'bold 26px Inter';
    let footerCursor = bX + PAD;
    for (const { icon, label } of footerItems) {
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${icon}  ${label}`, footerCursor, footerY);
      footerCursor += ctx.measureText(`${icon}  ${label}`).width + 60;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = 'bold 26px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const onlineDotX = bX + bW - PAD - 80;
    ctx.fillText('online', bX + bW - PAD, footerY);
    ctx.save();
    ctx.fillStyle = '#34C759';
    ctx.beginPath();
    ctx.arc(onlineDotX, footerY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer('image/png'));
  } catch (e) {
    console.error('[generate-banner-v3]', e.message);
    res.status(500).json({ error: 'Erro ao gerar imagem', message: e.message });
  }
}

function truncate(ctx, text, font, maxWidth) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 1) t = t.slice(0, -1);
  return t + '…';
}
