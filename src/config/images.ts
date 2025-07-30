// Configuración de imágenes de la aplicación
export const IMAGE_CONFIG = {
  // Imágenes de instructores
  instructors: {
    placeholder: {
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      alt: 'Instructor de Hapkido'
    },
    list: [
      {
        id: 1,
        url: '/images/instructors/kimberly.jpeg',
        alt: 'Kimberly - Instructora de Hapkido',
        name: 'Kimberly',
        rank: '4to Dan',
        bio: 'Instructora certificada con más de 10 años de experiencia en artes marciales y defensa personal.'
      },
      {
        id: 2,
        url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80',
        alt: 'Instructor 2',
        name: 'Instructor Asistente',
        rank: '3er Dan',
        bio: 'Especialista en técnicas de combate y defensa personal.'
      },
      {
        id: 3,
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        alt: 'Instructor 3',
        name: 'Instructor Junior',
        rank: '2do Dan',
        bio: 'Enfoque en entrenamiento para principiantes y niños.'
      }
    ]
  },
  // Imágenes del hero
  hero: {
    images: [
      {
        id: 1,
        url: 'https://images.unsplash.com/photo-1540206276207-3af25c08abc4?w=1600&auto=format&fit=crop&q=80',
        alt: 'Clase de Hapkido 1'
      },
      {
        id: 2,
        url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&auto=format&fit=crop&q=80',
        alt: 'Clase de Hapkido 2'
      },
      {
        id: 3,
        url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=1600&auto=format&fit=crop&q=80',
        alt: 'Clase de Hapkido 3'
      }
    ]
  },
  // Imágenes de la galería
  gallery: {
    placeholder: {
      url: 'https://images.unsplash.com/photo-1540206276207-3af25c08abc4?w=800&auto=format&fit=crop&q=80',
      alt: 'Imagen de la galería'
    }
  }
};

export default IMAGE_CONFIG;
