// Utilidad para optimización de imágenes

/**
 * Optimiza la URL de una imagen según las especificaciones
 * @param src - Ruta de la imagen original
 * @param options - Opciones de optimización
 * @returns URL optimizada
 */
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png' | 'original';
  } = {}
): string {
  // Si es una URL externa o ya está optimizada, devolver tal cual
  if (src.startsWith('http') || src.startsWith('data:') || src.includes('?')) {
    return src;
  }

  const { width, height, quality = 80, format = 'webp' } = options;
  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  if (format !== 'original') params.append('fm', format);

  // Si no hay parámetros, devolver la imagen original
  if (params.toString() === '') return src;

  // En desarrollo, usar la ruta original
  if (import.meta.env.DEV) return src;

  // En producción, usar el optimizador de imágenes
  return `${src}?${params.toString()}`;
}

/**
 * Genera atributos srcset para imágenes responsive
 * @param src - Ruta base de la imagen
 * @param sizes - Array de tamaños para el srcset
 * @returns String con el atributo srcset
 */
export function generateSrcSet(
  src: string,
  sizes: { width: number; height?: number }[]
): string {
  return sizes
    .map(({ width, height }) => {
      const params = new URLSearchParams();
      params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      return `${src}?${params.toString()} ${width}w`;
    })
    .join(', ');
}

/**
 * Prepara una imagen para lazy loading
 * @param src - Ruta de la imagen
 * @param options - Opciones de optimización
 * @returns Objeto con atributos para la etiqueta img
 */
export function lazyImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    alt?: string;
    className?: string;
    sizes?: string;
    srcSet?: { width: number; height?: number }[];
  } = {}
) {
  const { width, height, alt = '', className = '', sizes, srcSet } = options;
  const baseSrc = optimizeImage(src, { width, height });
  
  const attrs: Record<string, string> = {
    'data-src': baseSrc,
    'loading': 'lazy',
    'decoding': 'async',
    'alt': alt,
    'class': `lazy ${className}`.trim(),
  };

  if (width) attrs.width = width.toString();
  if (height) attrs.height = height.toString();
  if (sizes) attrs.sizes = sizes;
  
  if (srcSet && srcSet.length > 0) {
    attrs['data-srcset'] = generateSrcSet(src, srcSet);
  }

  // Agregar un placeholder pequeño en base64
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Q2FyZ2FuZG8uLi48L3RleHQ+PC9zdmc+';
  attrs.src = placeholder;

  return attrs;
}
