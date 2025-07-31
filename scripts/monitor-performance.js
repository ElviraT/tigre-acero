/**
 * Script de Monitoreo de Rendimiento
 * 
 * Este script recopila métricas de rendimiento del sitio web y las envía a un servicio de análisis.
 * También proporciona información de diagnóstico en la consola del navegador.
 */

// Configuración
const CONFIG = {
  // Habilitar/deshabilitar el registro en consola
  debug: true,
  
  // URL del endpoint para enviar métricas (si es necesario)
  analyticsEndpoint: '/api/analytics/performance',
  
  // Umbrales de rendimiento (en milisegundos)
  thresholds: {
    tti: 3500,      // Time to Interactive
    lcp: 2500,      // Largest Contentful Paint
    fid: 100,       // First Input Delay
    cls: 0.1,       // Cumulative Layout Shift
    tbt: 300,       // Total Blocking Time
  },
  
  // Métricas a rastrear
  metrics: {
    navigationTiming: true,
    paintTiming: true,
    resourceTiming: true,
    longTasks: true,
    elementTiming: true,
  },
};

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isSending = false;
    this.init();
  }

  init() {
    // Esperar a que el documento esté completamente cargado
    if (document.readyState === 'complete') {
      this.setupPerformanceObservers();
    } else {
      window.addEventListener('load', () => {
        this.setupPerformanceObservers();
      });
    }

    // Configurar el envío de métricas cuando la página esté inactiva
    this.setupBeforeUnload();
  }

  setupPerformanceObservers() {
    // Observador para métricas de pintura (LCP, FCP, etc.)
    if (CONFIG.metrics.paintTiming && 'PerformancePaintTiming' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.logMetric(entry.name, entry.startTime);
          this.metrics.set(entry.name, entry.startTime);
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    }

    // Observador para métricas de recursos
    if (CONFIG.metrics.resourceTiming && 'PerformanceResourceTiming' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const metricName = `resource_${entry.initiatorType}`;
          this.logMetric(metricName, entry.duration);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }

    // Observador para tareas largas
    if (CONFIG.metrics.longTasks && 'PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.logMetric('long_task', entry.duration);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }

    // Observador para métricas de elementos
    if (CONFIG.metrics.elementTiming && 'PerformanceElementTiming' in window) {
      const elementObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.logMetric(`element_${entry.identifier}`, entry.loadTime);
        });
      });
      elementObserver.observe({ entryTypes: ['element'] });
    }

    // Recolectar métricas de navegación
    if (CONFIG.metrics.navigationTiming) {
      this.collectNavigationTiming();
    }
  }

  collectNavigationTiming() {
    // Usar la API de Navigation Timing
    if ('performance' in window) {
      const timing = window.performance.timing;
      const now = new Date().getTime();

      // Calcular métricas clave
      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        loadEvent: timing.loadEventEnd - timing.navigationStart,
      };

      // Almacenar métricas
      Object.entries(metrics).forEach(([key, value]) => {
        this.metrics.set(`nav_${key}`, value);
        this.logMetric(`nav_${key}`, value);
      });

      // Calcular y registrar TTI (Time to Interactive) aproximado
      const tti = timing.domInteractive - timing.navigationStart;
      this.metrics.set('tti', tti);
      this.logMetric('tti', tti);
    }
  }

  logMetric(name, value) {
    if (CONFIG.debug) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  setupBeforeUnload() {
    // Usar requestIdleCallback para enviar métricas cuando el navegador esté inactivo
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => this.sendMetrics(),
        { timeout: 2000 }
      );
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      window.addEventListener('beforeunload', () => {
        this.sendMetrics();
      });
    }
  }

  async sendMetrics() {
    if (this.isSending) return;
    this.isSending = true;

    try {
      // Convertir el mapa de métricas a un objeto
      const metricsData = Object.fromEntries(this.metrics);
      
      // Agregar metadatos adicionales
      const payload = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          rtt: navigator.connection.rtt,
          downlink: navigator.connection.downlink,
          saveData: navigator.connection.saveData,
        } : null,
        ...metricsData,
      };

      // Mostrar métricas en consola en modo depuración
      if (CONFIG.debug) {
        console.group('Métricas de Rendimiento');
        console.table(payload);
        console.groupEnd();
      }

      // Enviar métricas al servidor (si está configurado)
      if (CONFIG.analyticsEndpoint) {
        const response = await fetch(CONFIG.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Usar sendBeacon si está disponible para envío confiable
          keepalive: true,
        });

        if (!response.ok) {
          console.error('Error al enviar métricas:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error en el monitoreo de rendimiento:', error);
    } finally {
      this.isSending = false;
    }
  }

  // Método para registrar métricas personalizadas
  trackCustomMetric(name, value) {
    if (typeof name === 'string' && typeof value === 'number') {
      this.metrics.set(`custom_${name}`, value);
      this.logMetric(`custom_${name}`, value);
    }
  }

  // Verificar si las métricas cumplen con los umbrales
  checkThresholds() {
    const results = {};
    
    Object.entries(CONFIG.thresholds).forEach(([metric, threshold]) => {
      const value = this.metrics.get(metric) || 0;
      results[metric] = {
        value,
        threshold,
        passed: value <= threshold,
      };
    });

    return results;
  }
}

// Inicializar el monitor de rendimiento
document.addEventListener('DOMContentLoaded', () => {
  // Crear una instancia global para acceso desde la consola
  window.performanceMonitor = new PerformanceMonitor();
  
  // También podemos exponer métodos útiles globalmente para depuración
  window.getPerformanceMetrics = () => Object.fromEntries(window.performanceMonitor.metrics);
  window.checkPerformanceThresholds = () => window.performanceMonitor.checkThresholds();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor };
}
