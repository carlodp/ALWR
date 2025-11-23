/**
 * Centralized logger utility for the application
 * Provides structured logging with levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTime(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  private format(level: LogLevel, source: string, message: string): string {
    const time = this.formatTime();
    return `${time} [${level.toUpperCase()}] [${source}] ${message}`;
  }

  debug(message: string, source = 'app') {
    if (this.isDevelopment) {
      console.log(this.format('debug', source, message));
    }
  }

  info(message: string, source = 'app') {
    console.log(this.format('info', source, message));
  }

  warn(message: string, source = 'app') {
    console.warn(this.format('warn', source, message));
  }

  error(message: string, source = 'app', error?: unknown) {
    console.error(this.format('error', source, message));
    if (error && this.isDevelopment) {
      console.error(error);
    }
  }
}

export const logger = new Logger();
