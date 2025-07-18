// Performance monitoring utilities

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Basic load metrics
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      }
    });

    // Web Vitals
    this.observeWebVitals();
  }

  private observeWebVitals() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics;
  }

  public reportMetrics() {
    const metrics = this.getMetrics();
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.table(metrics);
    }

    // In production, you would send this to your analytics service
    // Example: analytics.track('performance_metrics', metrics);
    
    return metrics;
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function to report metrics
export function reportPerformanceMetrics() {
  return performanceMonitor.reportMetrics();
}

// Helper function to measure custom operations
export function measureOperation<T>(name: string, operation: () => T): T {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}

// Helper function to measure async operations
export async function measureAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}