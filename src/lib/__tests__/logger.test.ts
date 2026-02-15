import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Store original environment
    originalEnv = import.meta.env.MODE;
  });

  afterEach(() => {
    // Restore spies
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    
    // Restore environment
    if (originalEnv !== undefined) {
      import.meta.env.MODE = originalEnv;
    }
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      expect(logger.isDevelopment()).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize CPF with dots and dashes', () => {
      const result = logger.sanitize({ cpf: '123.456.789-00' });
      expect(result.cpf).toBe('***.***.***-**');
    });

    it('should sanitize CPF without formatting', () => {
      const result = logger.sanitize({ cpf: '12345678900' });
      expect(result.cpf).toBe('***.***.***-**');
    });

    it('should sanitize email addresses', () => {
      const result = logger.sanitize({ email: 'user@example.com' });
      expect(result.email).toBe('u***@example.com');
    });

    it('should sanitize multiple emails', () => {
      const result = logger.sanitize({ 
        email1: 'john.doe@company.com',
        email2: 'jane@test.org'
      });
      expect(result.email1).toBe('j***@company.com');
      expect(result.email2).toBe('j***@test.org');
    });

    it('should sanitize password fields', () => {
      const result = logger.sanitize({ password: 'secret123' });
      expect(result.password).toBe('***REDACTED***');
    });

    it('should sanitize token fields', () => {
      const result = logger.sanitize({ 
        token: 'abc123xyz',
        authToken: 'bearer xyz',
        accessToken: 'token123'
      });
      expect(result.token).toBe('***REDACTED***');
      expect(result.authToken).toBe('***REDACTED***');
      expect(result.accessToken).toBe('***REDACTED***');
    });

    it('should sanitize secret and key fields', () => {
      const result = logger.sanitize({ 
        secret: 'mysecret',
        apiKey: 'key123',
        secretKey: 'secret123'
      });
      expect(result.secret).toBe('***REDACTED***');
      expect(result.apiKey).toBe('***REDACTED***');
      expect(result.secretKey).toBe('***REDACTED***');
    });

    it('should sanitize UUIDs partially', () => {
      const result = logger.sanitize({ 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      });
      expect(result.id).toBe('550e8400-****-****-****-************');
    });

    it('should sanitize numeric IDs', () => {
      const result = logger.sanitize({ 
        userId: 12345,
        clientId: 67890
      });
      expect(result.userId).toBe('***');
      expect(result.clientId).toBe('***');
    });

    it('should handle nested objects', () => {
      const result = logger.sanitize({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          cpf: '123.456.789-00'
        }
      });
      expect(result.user).toEqual({
        name: 'John Doe',
        email: 'j***@example.com',
        cpf: '***.***.***-**'
      });
    });

    it('should handle arrays of objects', () => {
      const result = logger.sanitize({
        users: [
          { email: 'user1@test.com' },
          { email: 'user2@test.com' }
        ]
      });
      expect(result.users).toEqual([
        { email: 'u***@test.com' },
        { email: 'u***@test.com' }
      ]);
    });

    it('should preserve null and undefined values', () => {
      const result = logger.sanitize({
        nullValue: null,
        undefinedValue: undefined,
        normalValue: 'test'
      });
      expect(result.nullValue).toBe(null);
      expect(result.undefinedValue).toBe(undefined);
      expect(result.normalValue).toBe('test');
    });

    it('should not sanitize non-sensitive data', () => {
      const result = logger.sanitize({
        name: 'John Doe',
        age: 30,
        city: 'São Paulo',
        active: true
      });
      expect(result).toEqual({
        name: 'John Doe',
        age: 30,
        city: 'São Paulo',
        active: true
      });
    });
  });

  describe('Log Levels in Development', () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
      import.meta.env.MODE = 'development';
    });

    it('should log debug messages in development', () => {
      logger.debug('Debug message', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info messages in development', () => {
      logger.info('Info message', { data: 'test' });
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warn messages in development', () => {
      logger.warn('Warning message', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages in development', () => {
      logger.error('Error message', new Error('Test error'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should sanitize data in debug logs', () => {
      logger.debug('User data', { email: 'user@test.com', cpf: '123.456.789-00' });
      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0];
      const loggedData = callArgs[2];
      expect(loggedData.email).toBe('u***@test.com');
      expect(loggedData.cpf).toBe('***.***.***-**');
    });
  });

  describe('Log Levels in Production', () => {
    beforeEach(() => {
      import.meta.env.DEV = false;
      import.meta.env.MODE = 'production';
    });

    it('should NOT log debug messages in production', () => {
      logger.debug('Debug message', { data: 'test' });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT log info messages in production', () => {
      logger.info('Info message', { data: 'test' });
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should ALWAYS log warn messages in production', () => {
      logger.warn('Warning message', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should ALWAYS log error messages in production', () => {
      logger.error('Error message', new Error('Test error'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Log Formatting', () => {
    it('should include timestamp in logs', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArgs = consoleErrorSpy.mock.calls[0];
      const prefix = callArgs[0];
      expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\]/);
    });

    it('should include log level in logs', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0];
      const prefix = callArgs[0];
      expect(prefix).toContain('[WARN]');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle deeply nested objects with sensitive data', () => {
      const complexData = {
        company: {
          name: 'Test Company',
          owner: {
            name: 'John Doe',
            email: 'john@company.com',
            documents: {
              cpf: '123.456.789-00',
              rg: '12.345.678-9'
            }
          },
          employees: [
            { name: 'Jane', email: 'jane@company.com' },
            { name: 'Bob', email: 'bob@company.com' }
          ]
        }
      };

      const result = logger.sanitize(complexData);
      
      expect(result.company.owner.email).toBe('j***@company.com');
      expect(result.company.owner.documents.cpf).toBe('***.***.***-**');
      expect(result.company.employees[0].email).toBe('j***@company.com');
      expect(result.company.employees[1].email).toBe('b***@company.com');
    });

    it('should handle mixed sensitive and non-sensitive data', () => {
      logger.debug('Processing payment', {
        amount: 100.50,
        currency: 'BRL',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          cpf: '123.456.789-00'
        },
        token: 'payment_token_123'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0];
      const loggedData = callArgs[2];
      
      expect(loggedData.amount).toBe(100.50);
      expect(loggedData.currency).toBe('BRL');
      expect(loggedData.customer.name).toBe('John Doe');
      expect(loggedData.customer.email).toBe('j***@example.com');
      expect(loggedData.customer.cpf).toBe('***.***.***-**');
      expect(loggedData.token).toBe('***REDACTED***');
    });
  });
});
