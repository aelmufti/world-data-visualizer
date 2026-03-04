/**
 * Tests for error handling utilities
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorType,
  ERROR_MESSAGES,
  getErrorMessage,
  formatRetryAfterTime,
  logError
} from './errorHandling';

describe('Error Handling Utilities', () => {
  describe('getErrorMessage', () => {
    it('should return network error message for fetch failures', () => {
      const error = new Error('Failed to fetch');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorType.NETWORK]);
    });

    it('should return rate limit message for 429 errors', () => {
      const error = new Error('HTTP 429: Too Many Requests');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorType.RATE_LIMIT]);
    });

    it('should return not found message for 404 errors', () => {
      const error = new Error('HTTP 404: Not Found');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorType.NOT_FOUND]);
    });

    it('should return invalid data message for malformed data', () => {
      const error = new Error('Invalid data received');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorType.INVALID_DATA]);
    });

    it('should return unknown error message for unrecognized errors', () => {
      const error = new Error('Something weird happened');
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorType.UNKNOWN]);
    });

    it('should handle string errors', () => {
      const message = getErrorMessage('Failed to fetch');
      expect(message).toBe(ERROR_MESSAGES[ErrorType.NETWORK]);
    });
  });

  describe('formatRetryAfterTime', () => {
    it('should format seconds correctly', () => {
      expect(formatRetryAfterTime(30)).toBe('30 seconds');
      expect(formatRetryAfterTime(1)).toBe('1 second');
    });

    it('should format minutes correctly', () => {
      expect(formatRetryAfterTime(60)).toBe('1 minute');
      expect(formatRetryAfterTime(120)).toBe('2 minutes');
      expect(formatRetryAfterTime(90)).toBe('2 minutes'); // Rounds up
    });
  });

  describe('logError', () => {
    it('should log error without throwing', () => {
      const error = new Error('Test error');
      expect(() => {
        logError(error, {
          component: 'TestComponent',
          action: 'testAction'
        });
      }).not.toThrow();
    });

    it('should handle string errors', () => {
      expect(() => {
        logError('Test error string', {
          component: 'TestComponent'
        });
      }).not.toThrow();
    });
  });
});
