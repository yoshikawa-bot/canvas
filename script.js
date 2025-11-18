class BannerGenerator {
    constructor() {
        this.canvas = document.getElementById('bannerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.images = {
            background: null,
            circle: null
        };
        this.loaded = 0;
        this.totalImages = 2;
        
        this.init();
    }

    async init() {
        await this.loadImages();
        this.drawBanner();
        this.setupDownload();
    }

    loadImages() {
        return new Promise((resolve) => {
            const imageUrls = {
                background: 'https://yoshikawa-bot.github.io/cache/images/5dfa5fbe.jpg',
                circle: 'https://yoshikawa-bot.github.io/cache/images/ec66fad2.jpg'
            };

            Object.entries(imageUrls).forEach(([key, url]) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    this.images[key] = img;
                    this.loaded++;
                    if (this.loaded === this.totalImages) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Erro ao carregar imagem: ${url}`);
                    this.loaded++;
                    if (this.loaded === this.totalImages) {
                        resolve();
                    }
                };
                img.src = url;
            });
        });
    }

    drawBanner() {
        const { width, height } = this.canvas;
        
        // Limpar canvas
        this.ctx.clearRect(0, 0, width, height);

        // Desenhar fundo
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, width, height);
        } else {
            // Fallback se a imagem não carregar
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.fillRect(0, 0, width, height);
        }

        // Desenhar círculo central
        if (this.images.circle) {
            const circleSize = 120;
            const circleX = (width - circleSize) / 2;
            const circleY = 80;
            
            // Sombra do círculo
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;
            
            this.ctx.drawImage(this.images.circle, circleX, circleY, circleSize, circleSize);
            
            // Resetar sombra
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // Título
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 4;
        
        this.ctx.fillText('# Título mostrado', width / 2, 250);

        // Resetar sombra para os horários
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;

        // Horários
        this.ctx.fillStyle = '#ECF0F1';
        this.ctx.font = 'bold 36px Arial';
        
        // Primeiro horário (esquerda)
        this.ctx.textAlign = 'right';
        this.ctx.fillText('1:46', width / 2 - 40, 320);
        
        // Segundo horário (direita)
        this.ctx.textAlign = 'left';
        this.ctx.fillText('3:58', width / 2 + 40, 320);

        // Linha divisória entre horários
        this.ctx.strokeStyle = '#ECF0F1';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 300);
        this.ctx.lineTo(width / 2, 340);
        this.ctx.stroke();
    }

    setupDownload() {
        document.getElementById('downloadBtn').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'banner.png';
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        });
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BannerGenerator();
});

// Recarregar banner se as imagens falharem
window.addEventListener('online', () => {
    const banner = new BannerGenerator();
});
