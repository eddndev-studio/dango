import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURACIÓN ---
const INPUT_ROOT = path.join(__dirname, '../raw_images');
const OUTPUT_ROOT = path.join(__dirname, '../public/images');

// Configuración de calidad
const CONFIG = {
  width: 1920, // Max ancho (Full HD)
  quality: 80, // Calidad WebP (0-100)
  effort: 4, // Esfuerzo de compresión (0-6)
};

async function processImages() {
  console.log('🚀 Iniciando sincronización de imágenes (Mirror Mode)...');
  console.log(`📂 Origen: ${INPUT_ROOT}`);
  console.log(`📂 Destino: ${OUTPUT_ROOT}\n`);

  try {
    await fs.access(INPUT_ROOT);
  } catch {
    console.error(`❌ No existe la carpeta: ${INPUT_ROOT}`);
    await fs.mkdir(INPUT_ROOT, { recursive: true });
    console.log(
      '✅ Carpeta creada. Coloca tus imágenes ahí y vuelve a ejecutar.',
    );
    return;
  }

  const startTime = Date.now();

  // Función recursiva para procesar
  await processDirectory(INPUT_ROOT);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ ¡Procesamiento completado!`);
  console.log(`⏱️  Tiempo total: ${duration}s`);
}

async function processDirectory(currentDir) {
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch (e) {
    console.error(`Error leyendo directorio ${currentDir}:`, e);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(INPUT_ROOT, currentDir);
    const outputDir = path.join(OUTPUT_ROOT, relativePath);

    // Si es carpeta, entramos recursivamente
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    }
    // Si es imagen, procesamos
    else if (
      entry.isFile() &&
      entry.name.match(/\.(jpg|jpeg|png|tiff|bmp)$/i)
    ) {
      // Asegurar que existe la carpeta destino
      await fs.mkdir(outputDir, { recursive: true });

      await optimizeImage(fullPath, outputDir, entry.name);
    }
  }
}

async function optimizeImage(inputPath, outputDir, filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const outputFilename = `${nameWithoutExt}.webp`;
  const outputPath = path.join(outputDir, outputFilename);
  const relInput = path.relative(path.join(__dirname, '..'), inputPath);

  try {
    // Verificar si ya existe (opcional: quitar comentario para saltar existentes)
    // try { await fs.access(outputPath); return; } catch {}

    await sharp(inputPath)
      .resize(CONFIG.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: CONFIG.quality, effort: CONFIG.effort })
      .toFile(outputPath);

    console.log(
      `✅ ${relInput} \n   -> public/images/${path.relative(path.join(__dirname, '../public/images'), outputPath)}`,
    );
  } catch (err) {
    console.error(`❌ Error en ${filename}:`, err.message);
  }
}

processImages();
