/**
 * Script de Optimización de Imágenes
 * 
 * Este script procesa y optimiza imágenes en el proyecto para mejorar el rendimiento.
 * Soporta conversión a formatos modernos (WebP/AVIF) y optimización de metadatos.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminSvgo = require('imagemin-svgo');

// Configuración
const CONFIG = {
  // Directorios de entrada y salida
  inputDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../public/optimized-images'),
  
  // Formatos de salida
  formats: ['webp', 'avif'], // Formatos modernos a generar
  
  // Configuración de calidad
  quality: {
    jpg: 75,
    png: 80,
    webp: 80,
    avif: 60,
  },
  
  // Tamaños de imagen para responsive (ancho en píxeles)
  responsiveSizes: [320, 480, 768, 1024, 1366, 1920],
  
  // Configuración de compresión
  compression: {
    jpg: {
      quality: 75,
      progressive: true,
      mozjpeg: true,
    },
    png: {
      quality: [0.6, 0.8],
      speed: 4,
    },
    webp: {
      quality: 80,
      alphaQuality: 80,
    },
    avif: {
      quality: 60,
      speed: 8,
    },
  },
  
  // Archivos a ignorar (patrones glob)
  ignore: [
    '**/node_modules/**',
    '**/.*', // Archivos ocultos
    '**/*.webp',
    '**/*.avif',
    '**/optimized/**',
  ],
};

// Estadísticas de optimización
const stats = {
  total: 0,
  processed: 0,
  skipped: 0,
  errors: 0,
  savedBytes: 0,
  formats: {},
};

/**
 * Obtiene información sobre un archivo
 */
async function getFileInfo(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return {
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
    };
  } catch (error) {
    console.error(`Error al leer el archivo ${filePath}:`, error);
    return null;
  }
}

/**
 * Crea un directorio si no existe
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Procesa una imagen con Sharp
 */
async function processImage(inputPath, outputPath, options = {}) {
  const { width, format, quality } = options;
  const image = sharp(inputPath);
  
  // Obtener metadatos de la imagen
  const metadata = await image.metadata();
  
  // Configurar las opciones de transformación
  const transform = image.clone();
  
  // Redimensionar si se especifica un ancho
  if (width && metadata.width > width) {
    transform.resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
    });
  }
  
  // Aplicar formato de salida
  let outputBuffer;
  const outputOptions = { quality };
  
  switch (format) {
    case 'webp':
      outputBuffer = await transform.webp(outputOptions).toBuffer();
      break;
    case 'avif':
      outputBuffer = await transform.avif(outputOptions).toBuffer();
      break;
    case 'jpg':
    case 'jpeg':
      outputBuffer = await transform.jpeg({ ...outputOptions, mozjpeg: true }).toBuffer();
      break;
    case 'png':
      outputBuffer = await transform.png(outputOptions).toBuffer();
      break;
    default:
      // Si no se especifica formato, mantener el original
      outputBuffer = await transform.toBuffer();
  }
  
  // Guardar la imagen optimizada
  await fs.writeFile(outputPath, outputBuffer);
  
  return {
    inputSize: metadata.size,
    outputSize: outputBuffer.length,
    width: width || metadata.width,
    format: format || metadata.format,
    savedBytes: metadata.size - outputBuffer.length,
    savings: ((metadata.size - outputBuffer.length) / metadata.size * 100).toFixed(2) + '%',
  };
}

/**
 * Optimiza una imagen usando Imagemin
 */
async function optimizeImage(inputPath, outputPath, format) {
  try {
    const plugins = [];
    const inputBuffer = await fs.readFile(inputPath);
    
    // Configurar plugins según el formato
    switch (format) {
      case 'jpg':
      case 'jpeg':
        plugins.push(
          imageminMozjpeg(CONFIG.compression.jpg)
        );
        break;
      case 'png':
        plugins.push(
          imageminPngquant(CONFIG.compression.png)
        );
        break;
      case 'webp':
        plugins.push(
          imageminWebp(CONFIG.compression.webp)
        );
        break;
      case 'gif':
        plugins.push(
          imageminGifsicle()
        );
        break;
      case 'svg':
        plugins.push(
          imageminSvgo()
        );
        break;
    }
    
    // Si no hay plugins configurados, copiar el archivo sin cambios
    if (plugins.length === 0) {
      await fs.copyFile(inputPath, outputPath);
      return { skipped: true };
    }
    
    // Procesar la imagen
    const result = await imagemin.buffer(inputBuffer, {
      plugins,
    });
    
    // Guardar la imagen optimizada
    await fs.writeFile(outputPath, result);
    
    return {
      inputSize: inputBuffer.length,
      outputSize: result.length,
      savedBytes: inputBuffer.length - result.length,
      savings: ((inputBuffer.length - result.length) / inputBuffer.length * 100).toFixed(2) + '%',
    };
  } catch (error) {
    console.error(`Error al optimizar ${inputPath}:`, error);
    return { error: error.message };
  }
}

/**
 * Procesa un directorio de imágenes recursivamente
 */
async function processDirectory(dir, relativePath = '') {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      // Saltar directorios y archivos ignorados
      if (CONFIG.ignore.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(relPath);
      })) {
        console.log(`Ignorando: ${relPath}`);
        stats.skipped++;
        continue;
      }
      
      if (entry.isDirectory()) {
        // Procesar subdirectorio
        await processDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        // Procesar archivo de imagen
        const ext = path.extname(entry.name).toLowerCase().substring(1);
        
        // Solo procesar formatos de imagen soportados
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)) {
          await processImageFile(fullPath, relPath, ext);
        } else {
          console.log(`Formato no soportado: ${relPath}`);
          stats.skipped++;
        }
      }
    }
  } catch (error) {
    console.error(`Error al procesar el directorio ${dir}:`, error);
    stats.errors++;
  }
}

/**
 * Procesa un archivo de imagen
 */
async function processImageFile(inputPath, relPath, ext) {
  stats.total++;
  console.log(`Procesando: ${relPath}`);
  
  try {
    const inputStats = await getFileInfo(inputPath);
    if (!inputStats) {
      stats.errors++;
      return;
    }
    
    // Crear directorio de salida si no existe
    const outputDir = path.join(CONFIG.outputDir, path.dirname(relPath));
    await ensureDir(outputDir);
    
    // Procesar la imagen en diferentes formatos y tamaños
    const formats = [...new Set([ext, ...CONFIG.formats])];
    
    for (const format of formats) {
      // Procesar en diferentes tamaños para responsive
      for (const width of [null, ...CONFIG.responsiveSizes]) {
        const outputName = path.basename(relPath, path.extname(relPath)) + 
          (width ? `-${width}w` : '') + 
          `.${format}`;
        const outputPath = path.join(outputDir, outputName);
        
        // Saltar si el archivo ya existe y es más reciente que el original
        try {
          const outputStats = await getFileInfo(outputPath);
          if (outputStats && outputStats.modifiedAt > inputStats.modifiedAt) {
            console.log(`  ✓ Saltando ${outputName} (ya está actualizado)`);
            continue;
          }
        } catch (error) {
          // El archivo no existe, continuar con el procesamiento
        }
        
        // Procesar la imagen
        try {
          const result = await processImage(inputPath, outputPath, {
            width,
            format,
            quality: CONFIG.quality[format] || 80,
          });
          
          // Actualizar estadísticas
          stats.processed++;
          stats.savedBytes += result.savedBytes;
          stats.formats[format] = (stats.formats[format] || 0) + 1;
          
          console.log(`  ✓ Generado: ${outputName} (${result.savings} más pequeño)`);
        } catch (error) {
          console.error(`  ✗ Error al procesar ${outputName}:`, error.message);
          stats.errors++;
        }
      }
    }
    
    // Optimizar la imagen original
    const optimizedPath = path.join(outputDir, path.basename(relPath));
    const optimizedResult = await optimizeImage(inputPath, optimizedPath, ext);
    
    if (optimizedResult.error) {
      console.error(`  ✗ Error al optimizar ${relPath}:`, optimizedResult.error);
      stats.errors++;
    } else if (!optimizedResult.skipped) {
      stats.processed++;
      stats.savedBytes += optimizedResult.savedBytes;
      stats.formats[ext] = (stats.formats[ext] || 0) + 1;
      
      console.log(`  ✓ Optimizado: ${path.basename(relPath)} (${optimizedResult.savings} más pequeño)`);
    }
    
  } catch (error) {
    console.error(`Error al procesar ${relPath}:`, error);
    stats.errors++;
  }
}

/**
 * Muestra un resumen de las optimizaciones realizadas
 */
function showSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE OPTIMIZACIÓN DE IMÁGENES');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Estadísticas:`);
  console.log(`- Total de imágenes procesadas: ${stats.processed}`);
  console.log(`- Total de imágenes omitidas: ${stats.skipped}`);
  console.log(`- Errores: ${stats.errors}`);
  
  if (stats.savedBytes > 0) {
    const savedKB = (stats.savedBytes / 1024).toFixed(2);
    const savedMB = (stats.savedBytes / (1024 * 1024)).toFixed(2);
    console.log(`\n💾 Espacio ahorrado: ${savedKB} KB (${savedMB} MB)`);
  }
  
  if (Object.keys(stats.formats).length > 0) {
    console.log('\n📝 Formatos generados:');
    for (const [format, count] of Object.entries(stats.formats)) {
      console.log(`- ${format.toUpperCase()}: ${count} archivos`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('¡Optimización completada! 🎉');
  console.log('='.repeat(60) + '\n');
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando optimización de imágenes...\n');
  
  try {
    // Verificar si el directorio de entrada existe
    try {
      await fs.access(CONFIG.inputDir);
    } catch (error) {
      console.error(`❌ El directorio de entrada no existe: ${CONFIG.inputDir}`);
      process.exit(1);
    }
    
    // Crear directorio de salida si no existe
    await ensureDir(CONFIG.outputDir);
    
    // Procesar imágenes
    await processDirectory(CONFIG.inputDir);
    
    // Mostrar resumen
    showSummary();
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}
