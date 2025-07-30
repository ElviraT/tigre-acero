import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://tigredeacero.com',
  integrations: [
    tailwind({
      // Configuración básica de Tailwind
      applyBaseStyles: true,
      config: {
        // Usar el archivo de configuración personalizado
        path: './tailwind.config.cjs',
      },
    })
  ]
});