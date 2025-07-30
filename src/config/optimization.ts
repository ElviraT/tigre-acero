// Configuración de optimización

export const optimizationConfig = {
  // Configuración de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    sizes: [
      { width: 640, quality: 80 },
      { width: 768, quality: 80 },
      { width: 1024, quality: 80 },
      { width: 1280, quality: 80 },
      { width: 1536, quality: 80 },
    ],
    defaultQuality: 80,
    defaultWidth: 1024,
  },
  
  // Preload de recursos críticos
  preload: {
    fonts: [
      '/fonts/oswald-v49-latin-700.woff2',
      '/fonts/roboto-v30-latin-regular.woff2',
    ],
    images: [
      '/images/logo.png',
      '/images/hero/slider1.png',
    ],
  },
  
  // Prefetch de rutas importantes
  prefetch: [
    '/#nosotros',
    '/#clases',
    '/#instructores',
    '/#contacto',
  ],
  
  // Configuración de caché
  cache: {
    version: '1.0.0',
    offlinePage: '/offline.html',
    cacheName: 'tigre-de-acero-v1',
    assets: [
      '/',
      '/index.html',
      '/css/main.css',
      '/js/main.js',
      '/images/logo.png',
      '/images/favicon.ico',
      '/site.webmanifest',
    ],
  },
  
  // Configuración de analíticas
  analytics: {
    gaId: 'G-XXXXXXXXXX', // Reemplazar con el ID de Google Analytics
    hotjarId: 'XXXXXXXX', // Reemplazar con el ID de Hotjar
  },
};

export default optimizationConfig;
