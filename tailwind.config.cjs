/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./public/**/*.html",
    "./node_modules/flowbite/**/*.js"
  ],
  important: true, // Asegura que los estilos de Tailwind tengan mayor especificidad
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
      },
      textColor: (theme) => ({
        ...theme('colors'),
        primary: {
          50: '#f5f9f8',
          100: '#e6f0ee',
          200: '#c9e0dc',
          300: '#9cc5bf',
          400: '#68a49d',
          500: '#4a8a82',
          600: '#3a6f68',
          700: '#315a55',
          800: '#2c4a46',
          900: '#273f3c',
        }
      }),
      borderColor: (theme) => ({
        ...theme('colors'),
        primary: {
          50: '#f5f9f8',
          100: '#e6f0ee',
          200: '#c9e0dc',
          300: '#9cc5bf',
          400: '#68a49d',
          500: '#4a8a82',
          600: '#3a6f68',
          700: '#315a55',
          800: '#2c4a46',
          900: '#273f3c',
        }
      }),
      colors: {
        // Colores principales
        primary: {
          50: '#f5f9f8',
          100: '#e6f0ee',
          200: '#c9e0dc',
          300: '#9cc5bf',
          400: '#68a49d',
          500: '#4a8a82',
          600: '#3a6f68',
          700: '#315a55',
          800: '#2c4a46',
          900: '#273f3c',
          light: '#9cc5bf',
          DEFAULT: '#4a8a82',
          dark: '#315a55',
          darker: '#2c4a46',
          darkest: '#1e3330'
        },
        // Colores secundarios
        secondary: {
          100: '#f9f5f0',
          200: '#f0e6d9',
          300: '#e0cdb4',
          400: '#d0b48f',
          500: '#c19a6b',
          600: '#b38656',
          700: '#8e6b44',
          800: '#6f5536',
          900: '#4a3d30',
          light: '#cbcdd1',
          DEFAULT: '#7e828f',
          dark: '#8e6b44',
        },
        // Color de acento
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          light: '#fca5a5',
          DEFAULT: '#c19a6b',
          dark: '#8e6b44',
        },
        // Escala de grises
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Colores de estado
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // Extender la configuración de colores para componentes específicos
      backgroundColor: (theme) => ({
        ...theme('colors'),
        body: '#f9fafb',
        card: '#ffffff',
      }),
      textColor: (theme) => ({
        ...theme('colors'),
        primary: theme('colors.primary.darker'),
        secondary: theme('colors.primary.dark'),
      }),
      borderColor: (theme) => ({
        ...theme('colors'),
        DEFAULT: theme('colors.gray.200', 'currentColor'),
        primary: theme('colors.primary.DEFAULT'),
      }),
      ringColor: (theme) => ({
        ...theme('colors'),
        primary: theme('colors.primary.DEFAULT'),
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
  // Configuración de modo oscuro basado en clase
  darkMode: 'class',
  // Prevenir que se generen estilos no utilizados
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  // Limitar el alcance de los estilos de formulario
  corePlugins: {
    preflight: true,
  },
  // Configuración de purga para producción
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    ],
    options: {
      safelist: [],
    },
  },
};