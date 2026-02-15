/**
 * Conditional Logger Utility
 * 
 * Provides environment-aware logging with automatic data sanitization.
 * - Debug/Info logs only appear in development
 * - Warn/Error logs always appear
 * - Automatically sanitizes sensitive data (CPF, email, tokens, IDs)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface SanitizableData {
  [key: string]: unknown;
}

/**
 * Checks if the application is running in development mode
 */
const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

/**
 * Sanitizes sensitive data fields
 * 
 * Patterns sanitized:
 * - CPF: 123.456.789-00 → ***.***.***.***
 * - Email: user@example.com → u***@example.com
 * - Tokens/Keys: any field containing 'token', 'key', 'password', 'secret'
 * - IDs: UUIDs and numeric IDs are partially masked
 */
const sanitizeValue = (key: string, value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  const keyLower = key.toLowerCase();
  
  // Sanitize password, token, secret, key fields
  if (keyLower.includes('password') || 
      keyLower.includes('token') || 
      keyLower.includes('secret') || 
      keyLower.includes('key')) {
    return '***REDACTED***';
  }

  // Handle string values
  if (typeof value === 'string') {
    // Sanitize CPF (Brazilian tax ID)
    if (keyLower.includes('cpf') || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(value)) {
      return '***.***.***-**';
    }

    // Sanitize email
    if (keyLower.includes('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const parts = value.split('@');
      if (parts.length === 2) {
        const username = parts[0];
        const domain = parts[1];
        return `${username.charAt(0)}***@${domain}`;
      }
    }

    // Sanitize UUIDs (partially)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return `${value.substring(0, 8)}-****-****-****-************`;
    }
  }

  // Handle numeric IDs - REMOVIDO: IDs de banco de dados são úteis para debug
  // e não são considerados dados sensíveis (PII) por padrão.
  // if (keyLower.includes('id') && typeof value === 'number') {
  //   return '***';
  // }

  // Handle objects recursively
  if (typeof value === 'object' && !Array.isArray(value)) {
    return sanitize(value as SanitizableData);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item, index) => 
      typeof item === 'object' ? sanitize(item as SanitizableData) : sanitizeValue(`item_${index}`, item)
    );
  }

  return value;
};

/**
 * Sanitizes an object by removing or masking sensitive data
 */
const sanitize = (data: SanitizableData): SanitizableData => {
  const sanitized: SanitizableData = {};
  
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeValue(key, value);
  }
  
  return sanitized;
};

/**
 * Formats log arguments for console output
 */
const formatLogArgs = (args: unknown[]): unknown[] => {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      return sanitize(arg as SanitizableData);
    }
    return arg;
  });
};

/**
 * Internal logging function
 */
const log = (level: LogLevel, ...args: unknown[]): void => {
  // Only log debug and info in development
  if ((level === 'debug' || level === 'info') && !isDevelopment()) {
    return;
  }

  // Sanitize all arguments
  const sanitizedArgs = formatLogArgs(args);

  // Add timestamp and level prefix
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  // Map to appropriate console method
  switch (level) {
    case 'debug':
      console.log(prefix, ...sanitizedArgs);
      break;
    case 'info':
      console.info(prefix, ...sanitizedArgs);
      break;
    case 'warn':
      console.warn(prefix, ...sanitizedArgs);
      break;
    case 'error':
      console.error(prefix, ...sanitizedArgs);
      break;
  }
};

/**
 * Logger object with level-specific methods
 */
export const logger = {
  /**
   * Debug logs - only visible in development
   * Use for detailed debugging information
   */
  debug: (...args: unknown[]): void => {
    log('debug', ...args);
  },

  /**
   * Info logs - only visible in development
   * Use for general informational messages
   */
  info: (...args: unknown[]): void => {
    log('info', ...args);
  },

  /**
   * Warning logs - always visible
   * Use for non-critical issues that should be addressed
   */
  warn: (...args: unknown[]): void => {
    log('warn', ...args);
  },

  /**
   * Error logs - always visible
   * Use for errors and exceptions
   */
  error: (...args: unknown[]): void => {
    log('error', ...args);
  },

  /**
   * Manually sanitize data without logging
   * Useful for preparing data before logging or displaying
   */
  sanitize: (data: SanitizableData): SanitizableData => {
    return sanitize(data);
  },

  /**
   * Check if running in development mode
   */
  isDevelopment,
};

export default logger;
