class BannerGenerator {
    constructor() {
        this.bannerImage = document.getElementById('bannerImage');
        this.canvas = document.getElementById('bannerCanvas');
        this.loading = document.getElementById('loading');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        this.init();
    }

    async init() {
        try {
            await this.loadBannerFromAPI();
            this.setupDownload();
        } catch (error) {
            console.error('Erro ao carregar banner:', error);
            this.loading.innerHTML = 'Erro ao carregar banner. Tentando novamente...';
            setTimeout(() => this.init(), 3000);
        }
    }

    async loadBannerFromAPI() {
        // URL da sua API na Vercel
        const apiUrl = '/api/generate-banner'; // Para local: 'http://localhost:3000/api/generate-banner'
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // Esconder loading e mostrar imagem
        this.bannerImage.src = imageUrl;
        this.bannerImage.style.display = 'block';
        this.loading.style.display = 'none';
        
        console.log('Banner carregado com sucesso!');
    }

    setupDownload() {
        this.downloadBtn.addEventListener('click', () => {
            // Criar link de download diretamente da imagem
            const link = document.createElement('a');
            link.download = 'banner-novo-design.png';
            link.href = this.bannerImage.src;
            link.click();
        });
        
        this.downloadBtn.disabled = false;
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BannerGenerator();
});
