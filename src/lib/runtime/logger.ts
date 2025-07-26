/**
 * Logger utility for structured logging across the application
 */

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class ScopedLogger implements Logger {
  constructor(private scope: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.scope}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.scope}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.scope}] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`[${this.scope}] ${message}`, ...args);
  }
}

/**
 * Creates a scoped logger instance
 * @param scope The scope/context for the logger (e.g., 'ActionRunner', 'MessageParser')
 * @returns A logger instance with the specified scope
 */
export function createScopedLogger(scope: string): Logger {
  return new ScopedLogger(scope);
}

/**
 * Default logger instance
 */
export const logger = createScopedLogger('App');