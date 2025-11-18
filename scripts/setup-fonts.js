import { writeFileSync, mkdirSync, existsSync } from 'fs'

async function setupFonts() {
  try {
    // Criar pasta fonts
    mkdirSync('./fonts', { recursive: true })

    const fontUrls = {
      'Roboto-Regular': 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf',
      'Roboto-Bold': 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf',
    }

    let downloadedCount = 0;

    for (const [name, url] of Object.entries(fontUrls)) {
      const filePath = `./fonts/${name}.ttf`
      if (!existsSync(filePath)) {
        console.log(`📥 Baixando ${name}.ttf...`)
        const response = await fetch(url)
        if (!response.ok) {
          console.log(`❌ Erro ao baixar ${name}`)
          continue
        }
        
        const buffer = await response.arrayBuffer()
        writeFileSync(filePath, Buffer.from(buffer))
        console.log(`✅ ${name}.ttf baixado!`)
        downloadedCount++
      } else {
        console.log(`📁 ${name}.ttf já existe`)
      }
    }

    if (downloadedCount > 0) {
      console.log(`🎉 ${downloadedCount} fontes baixadas com sucesso!`)
    } else {
      console.log('📝 Todas as fontes já estão instaladas')
    }

  } catch (error) {
    console.error('❌ Erro no setup:', error)
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupFonts()
}

export { setupFonts }
