export class Logger {
  private static isDev = process.env.NODE_ENV === 'development';

  static debug(...args: unknown[]) {
    if (Logger.isDev) {
      console.log('[DEBUG]', ...args);
    }
  }

  static info(...args: unknown[]) {
    if (Logger.isDev) {
      console.info('[INFO]', ...args);
    }
  }

  static warn(...args: unknown[]) {
    if (Logger.isDev) {
      console.warn('[WARN]', ...args);
    }
  }

  static error(...args: unknown[]) {
    console.error('[ERROR]', ...args);
  }
}
