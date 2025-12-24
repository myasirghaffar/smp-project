// Simple error tracking utility
// In production, integrate with Sentry or similar service

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  page?: string;
  action?: string;
  [key: string]: any;
}

class ErrorTracker {
  private errors: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private maxErrors = 100;

  logError(error: Error, context: ErrorContext = {}) {
    console.error('[ERROR]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Store error for debugging
    this.errors.push({
      error,
      context,
      timestamp: new Date(),
    });

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
  }

  logWarning(message: string, context: ErrorContext = {}) {
    console.warn('[WARNING]', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  logInfo(message: string, context: ErrorContext = {}) {
    console.info('[INFO]', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  clearErrors() {
    this.errors = [];
  }

  // Performance tracking
  measurePerformance(name: string, fn: () => any) {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        this.logWarning(`Slow operation: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      }
      
      return result;
    } catch (error) {
      this.logError(error as Error, { operation: name });
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (duration > 2000) {
        this.logWarning(`Slow async operation: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      }
      
      return result;
    } catch (error) {
      this.logError(error as Error, { operation: name });
      throw error;
    }
  }
}

export const errorTracker = new ErrorTracker();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.logError(event.error || new Error(event.message), {
      type: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.logError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        type: 'unhandledrejection',
        reason: event.reason,
      }
    );
  });
}
