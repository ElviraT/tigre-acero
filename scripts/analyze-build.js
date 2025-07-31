/**
 * Script de Análisis de Construcción
 * 
 * Este script analiza el sitio web construido y proporciona recomendaciones
 * para mejorar el rendimiento, accesibilidad y SEO.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const CONFIG = {
  // Directorios
  distDir: path.join(__dirname, '../dist'),
  publicDir: path.join(__dirname, '../public'),
  
  // Límites de tamaño (en KB)
  sizeLimits: {
    html: 100,    // 100KB
    css: 50,      // 50KB
    js: 100,      // 100KB
    image: 200,   // 200KB
    font: 100,    // 100KB
    other: 300,   // 300KB
  },
  
  // Umbrales de rendimiento (en milisegundos)
  performanceThresholds: {
    tti: 3500,      // Time to Interactive
    lcp: 2500,      // Largest Contentful Paint
    fid: 100,       // First Input Delay
    cls: 0.1,       // Cumulative Layout Shift
    tbt: 300,       // Total Blocking Time
  },
  
  // Extensiones de archivo por tipo
  fileTypes: {
    html: ['.html', '.htm'],
    css: ['.css'],
    js: ['.js', '.mjs', '.cjs'],
    image: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'],
    font: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
    other: ['.json', '.txt', '.xml', '.ico', '.webmanifest']
  }
};

// Resultados del análisis
const analysisResults = {
  stats: {
    totalFiles: 0,
    byType: {},
    totalSize: 0,
    largestFiles: [],
    potentialIssues: []
  },
  recommendations: []
};

/**
 * Obtiene información sobre un archivo
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      extension: path.extname(filePath).toLowerCase(),
      relativePath: path.relative(process.cwd(), filePath),
      lastModified: stats.mtime
    };
  } catch (error) {
    console.error(`Error al leer el archivo ${filePath}:`, error);
    return null;
  }
}

/**
 * Obtiene el tipo de archivo basado en la extensión
 */
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  
  for (const [type, extensions] of Object.entries(CONFIG.fileTypes)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }
  
  return 'other';
}

/**
 * Analiza un directorio recursivamente
 */
async function analyzeDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath);
      } else if (entry.isFile()) {
        await analyzeFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error al analizar el directorio ${dir}:`, error);
  }
}

/**
 * Analiza un archivo individual
 */
async function analyzeFile(filePath) {
  const fileInfo = await getFileInfo(filePath);
  if (!fileInfo) return;
  
  const fileType = getFileType(fileInfo.path);
  const sizeLimit = CONFIG.sizeLimits[fileType] * 1024; // Convertir a bytes
  
  // Actualizar estadísticas
  analysisResults.stats.totalFiles++;
  analysisResults.stats.totalSize += fileInfo.size;
  
  // Actualizar estadísticas por tipo
  if (!analysisResults.stats.byType[fileType]) {
    analysisResults.stats.byType[fileType] = {
      count: 0,
      totalSize: 0,
      largestFile: null,
      files: []
    };
  }
  
  const typeStats = analysisResults.stats.byType[fileType];
  typeStats.count++;
  typeStats.totalSize += fileInfo.size;
  typeStats.files.push(fileInfo);
  
  // Actualizar el archivo más grande de este tipo
  if (!typeStats.largestFile || fileInfo.size > typeStats.largestFile.size) {
    typeStats.largestFile = fileInfo;
  }
  
  // Verificar si el archivo excede el límite de tamaño
  if (sizeLimit && fileInfo.size > sizeLimit) {
    analysisResults.stats.potentialIssues.push({
      type: 'large_file',
      severity: 'warning',
      message: `El archivo ${fileInfo.relativePath} (${fileInfo.sizeKB}KB) excede el límite recomendado de ${(sizeLimit / 1024).toFixed(2)}KB`,
      file: fileInfo,
      recommendation: `Optimizar el archivo o dividirlo en fragmentos más pequeños.`
    });
  }
  
  // Verificar imágenes sin optimizar
  if (CONFIG.fileTypes.image.includes(fileInfo.extension)) {
    if (!fileInfo.path.includes('optimized') && !fileInfo.path.includes('dist')) {
      analysisResults.stats.potentialIssues.push({
        type: 'unoptimized_image',
        severity: 'warning',
        message: `Imagen sin optimizar: ${fileInfo.relativePath}`,
        file: fileInfo,
        recommendation: `Ejecutar 'npm run optimize' para optimizar las imágenes.`
      });
    }
  }
  
  // Verificar archivos JavaScript grandes
  if (fileType === 'js' && fileInfo.size > 500 * 1024) { // 500KB
    analysisResults.recommendations.push({
      type: 'large_js',
      severity: 'high',
      message: `El archivo JavaScript ${fileInfo.relativePath} es muy grande (${fileInfo.sizeKB}KB)`,
      recommendation: `Dividir el código en chunks más pequeños o implementar code-splitting.`
    });
  }
  
  // Verificar archivos CSS grandes
  if (fileType === 'css' && fileInfo.size > 50 * 1024) { // 50KB
    analysisResults.recommendations.push({
      type: 'large_css',
      severity: 'medium',
      message: `El archivo CSS ${fileInfo.relativePath} es muy grande (${fileInfo.sizeKB}KB)`,
      recommendation: `Dividir los estilos en módulos más pequeños o usar CSS-in-JS con extracción crítica.`
    });
  }
}

/**
 * Ejecuta Lighthouse para analizar el rendimiento
 */
async function runLighthouseAnalysis() {
  console.log('\n🔍 Ejecutando análisis de Lighthouse (esto puede tomar un momento)...');
  
  try {
    // Verificar si Lighthouse está instalado
    try {
      await exec('lighthouse --version');
    } catch (error) {
      console.log('Lighthouse no está instalado. Instalando globalmente...');
      await exec('npm install -g lighthouse');
    }
    
    // Ejecutar Lighthouse
    const { stdout, stderr } = await exec(`lighthouse http://localhost:4321 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"`);
    
    if (stderr) {
      console.warn('Advertencias de Lighthouse:', stderr);
    }
    
    // Procesar resultados de Lighthouse
    try {
      const report = JSON.parse(await fs.readFile('./lighthouse-report.json', 'utf-8'));
      processLighthouseResults(report);
      
      // Eliminar el archivo temporal
      await fs.unlink('./lighthouse-report.json');
    } catch (error) {
      console.error('Error al procesar el informe de Lighthouse:', error);
    }
  } catch (error) {
    console.error('Error al ejecutar Lighthouse:', error.message);
    console.log('Asegúrate de tener un servidor local en ejecución (ejecuta "npm run dev" en otra terminal)');
  }
}

/**
 * Procesa los resultados de Lighthouse
 */
function processLighthouseResults(report) {
  const { categories } = report;
  
  // Agregar métricas clave al análisis
  analysisResults.lighthouse = {
    performance: Math.round(categories.performance.score * 100),
    accessibility: Math.round(categories.accessibility.score * 100),
    bestPractices: Math.round(categories['best-practices'].score * 100),
    seo: Math.round(categories.seo.score * 100),
    pwa: report.categories.pwa ? Math.round(categories.pwa.score * 100) : null
  };
  
  // Agregar recomendaciones basadas en los resultados
  if (analysisResults.lighthouse.performance < 90) {
    analysisResults.recommendations.push({
      type: 'lighthouse_performance',
      severity: 'high',
      message: `La puntuación de rendimiento de Lighthouse es baja (${analysisResults.lighthouse.performance}/100)`,
      recommendation: 'Optimizar recursos críticos, implementar carga diferida de imágenes y scripts no críticos.'
    });
  }
  
  if (analysisResults.lighthouse.accessibility < 90) {
    analysisResults.recommendations.push({
      type: 'lighthouse_accessibility',
      severity: 'medium',
      message: `La puntuación de accesibilidad de Lighthouse es baja (${analysisResults.lighthouse.accessibility}/100)`,
      recommendation: 'Mejorar el contraste de colores, agregar texto alternativo a las imágenes y asegurar una navegación por teclado adecuada.'
    });
  }
  
  if (analysisResults.lighthouse.seo < 90) {
    analysisResults.recommendations.push({
      type: 'lighthouse_seo',
      severity: 'medium',
      message: `La puntuación de SEO de Lighthouse es baja (${analysisResults.lighthouse.seo}/100)`,
      recommendation: 'Mejorar los metadatos, agregar un sitemap.xml y asegurar URLs amigables.'
    });
  }
}

/**
 * Muestra un resumen del análisis
 */
function displayAnalysisSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DEL ANÁLISIS DE CONSTRUCCIÓN');
  console.log('='.repeat(80));
  
  // Estadísticas generales
  console.log('\n📦 ESTADÍSTICAS GENERALES');
  console.log('='.repeat(40));
  console.log(`Archivos totales: ${analysisResults.stats.totalFiles}`);
  console.log(`Tamaño total: ${(analysisResults.stats.totalSize / (1024 * 1024)).toFixed(2)} MB`);
  
  // Estadísticas por tipo de archivo
  console.log('\n📂 ESTADÍSTICAS POR TIPO DE ARCHIVO');
  console.log('='.repeat(40));
  
  for (const [type, stats] of Object.entries(analysisResults.stats.byType)) {
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`- Archivos: ${stats.count}`);
    console.log(`- Tamaño total: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`- Tamaño promedio: ${(stats.totalSize / stats.count / 1024).toFixed(2)} KB`);
    
    if (stats.largestFile) {
      console.log(`- Archivo más grande: ${stats.largestFile.relativePath} (${stats.largestFile.sizeKB} KB)`);
    }
  }
  
  // Resultados de Lighthouse
  if (analysisResults.lighthouse) {
    console.log('\n🏆 PUNTUACIONES DE LIGHTHOUSE');
    console.log('='.of(40));
    console.log(`Rendimiento: ${analysisResults.lighthouse.performance}/100`);
    console.log(`Accesibilidad: ${analysisResults.lighthouse.accessibility}/100`);
    console.log(`Mejores Prácticas: ${analysisResults.lighthouse.bestPractices}/100`);
    console.log(`SEO: ${analysisResults.lighthouse.seo}/100`);
    if (analysisResults.lighthouse.pwa !== null) {
      console.log(`PWA: ${analysisResults.lighthouse.pwa}/100`);
    }
  }
  
  // Problemas potenciales
  if (analysisResults.stats.potentialIssues.length > 0) {
    console.log('\n⚠️  PROBLEMAS POTENCIALES');
    console.log('='.repeat(40));
    
    for (const issue of analysisResults.stats.potentialIssues) {
      console.log(`\n[${issue.severity.toUpperCase()}] ${issue.message}`);
      console.log(`Recomendación: ${issue.recommendation}`);
    }
  }
  
  // Recomendaciones
  if (analysisResults.recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES');
    console.log('='.repeat(40));
    
    // Ordenar por severidad
    const severityOrder = { high: 1, medium: 2, low: 3 };
    const sortedRecs = [...analysisResults.recommendations].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
    
    for (const rec of sortedRecs) {
      console.log(`\n[${rec.severity.toUpperCase()}] ${rec.message}`);
      console.log(`→ ${rec.recommendation}`);
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('🎉 ANÁLISIS COMPLETADO');
  console.log('='.repeat(80));
  
  const totalIssues = analysisResults.stats.potentialIssues.length + analysisResults.recommendations.length;
  console.log(`\n🔍 Se encontraron ${totalIssues} problemas y recomendaciones.`);
  
  if (analysisResults.lighthouse) {
    const avgScore = (
      analysisResults.lighthouse.performance +
      analysisResults.lighthouse.accessibility +
      analysisResults.lighthouse.bestPractices +
      analysisResults.lighthouse.seo
    ) / (analysisResults.lighthouse.pwa !== null ? 5 : 4);
    
    console.log(`🏆 Puntuación promedio: ${Math.round(avgScore)}/100`);
  }
  
  console.log('\n💡 Ejecuta las recomendaciones para mejorar el rendimiento y la calidad del sitio.');
  console.log('='.repeat(80) + '\n');
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Iniciando análisis del sitio web...\n');
  
  try {
    // Verificar si el directorio dist existe
    try {
      await fs.access(CONFIG.distDir);
    } catch (error) {
      console.error(`❌ El directorio de construcción no existe: ${CONFIG.distDir}`);
      console.log('Ejecuta "npm run build" primero para construir el sitio.');
      process.exit(1);
    }
    
    // Analizar archivos
    console.log('📂 Analizando archivos...');
    await analyzeDirectory(CONFIG.distDir);
    
    // Ejecutar Lighthouse
    await runLighthouseAnalysis();
    
    // Mostrar resumen
    displayAnalysisSummary();
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  }
}

// Ejecutar el análisis
main();
