// Utilidad para mejorar la accesibilidad

/**
 * Agrega atributos ARIA a elementos interactivos que los necesiten
 */
export function enhanceAccessibility() {
  // Asegurar que todos los botones tengan tipo
  document.querySelectorAll('button:not([type])').forEach(button => {
    button.setAttribute('type', 'button');
  });

  // Agregar etiquetas ARIA a elementos interactivos
  document.querySelectorAll('a[href^="#"]:not([aria-label])').forEach(link => {
    const text = link.textContent?.trim() || '';
    if (text) {
      link.setAttribute('aria-label', `Ir a ${text}`);
    }
  });

  // Mejorar accesibilidad de imágenes
  document.querySelectorAll('img:not([alt])').forEach(img => {
    if (!img.getAttribute('alt') && !img.hasAttribute('aria-hidden')) {
      img.setAttribute('alt', 'Imagen decorativa');
      img.setAttribute('aria-hidden', 'true');
    }
  });

  // Mejorar accesibilidad de formularios
  document.querySelectorAll('input:not([id])').forEach((input, index) => {
    const id = `input-${index}-${Date.now()}`;
    input.id = id;
    
    // Si hay un label asociado, conectarlo
    const label = input.closest('label');
    if (label && !label.htmlFor) {
      label.htmlFor = id;
    }
  });
}

/**
 * Inicializa el manejo del foco para mejor accesibilidad
 */
export function initFocusManagement() {
  // Manejar el foco para modales y diálogos
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const modal = document.querySelector('.modal[aria-modal="true"]');
      
      if (modal) {
        const focusableContent = modal.querySelectorAll(focusableElements);
        const firstFocusableElement = focusableContent[0] as HTMLElement;
        const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    }
  });

  // Mejorar el foco para navegación por teclado
  document.documentElement.classList.add('keyboard-navigation');
  document.addEventListener('mousedown', () => {
    document.documentElement.classList.remove('keyboard-navigation');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('keyboard-navigation');
    }
  });
}

/**
 * Agrega un botón para saltar al contenido principal
 */
export function addSkipToContentLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Saltar al contenido principal';
  
  // Insertar al principio del body
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Estilos para el botón de salto
  const style = document.createElement('style');
  style.textContent = `
    .skip-to-content {
      position: absolute;
      top: -40px;
      left: 0;
      background: #b91c1c;
      color: white;
      padding: 8px 16px;
      z-index: 1000;
      transition: top 0.3s;
    }
    
    .skip-to-content:focus {
      top: 0;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Inicializa todas las mejoras de accesibilidad
 */
export function initAccessibility() {
  if (typeof window !== 'undefined') {
    enhanceAccessibility();
    initFocusManagement();
    addSkipToContentLink();
    
    // Agregar soporte para prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.documentElement.classList.add('reduced-motion');
    }
    
    mediaQuery.addEventListener('change', () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    });
  }
}
