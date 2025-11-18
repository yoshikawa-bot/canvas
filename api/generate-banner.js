import path from "path";
import {
  createCanvas,
  loadImage,
  GlobalFonts
} from "@napi-rs/canvas";

// Registrar fonte
const fontPath = path.join(process.cwd(), "fonts/Inter_18pt-Bold.ttf");
if (!GlobalFonts.has("Inter")) {
  GlobalFonts.registerFromPath(fontPath, "Inter");
}

export default async function handler(req, res) {
  try {
    // Resolução maior para nitidez
    const W = 1600;
    const H = 800;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Carregar imagens
    const bg = await loadImage("https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg");
    const avatar = await loadImage("https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg");

    // Fundo
    ctx.drawImage(bg, 0, 0, W, H);

    // Leve escurecimento
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, W, H);

    // ----- AVATAR -----
    const avatarSize = 260;
    const avatarX = 180;
    const avatarY = H / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borda do avatar
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#FBE2A4";
    ctx.stroke();

    // ----- TÍTULO -----
    ctx.font = "bold 95px Inter";
    ctx.fillStyle = "#FBE2A4";
    ctx.textAlign = "center";
    ctx.fillText("Título mostrado", W / 2 + 120, H / 2 - 40);

    // ----- BARRA -----
    const barWidth = 680;
    const barHeight = 26;
    const barX = W / 2 - barWidth / 2 + 120;
    const barY = H / 2 + 20;

    // Fundo da barra
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    // Progresso
    const current = 106;
    const total = 238;
    const ratio = current / total;

    ctx.fillStyle = "#FBE2A4";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 15);
    ctx.fill();

    // Marcador
    const markerX = barX + barWidth * ratio;
    const markerY = barY + barHeight / 2;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#FBE2A4";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ----- TEMPOS -----
    ctx.font = "bold 42px Inter";
    ctx.fill
