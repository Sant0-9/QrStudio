/**
 * Basic tests for QR code generation library
 * These tests verify the library functions work correctly
 */

import { describe, it, expect } from '@jest/globals';
import { generateQrSvg, validateQrPayload } from '../qr';

describe('QR Code Library', () => {
  describe('generateQrSvg', () => {
    it('should generate SVG string for simple text', async () => {
      const svg = await generateQrSvg('Hello World');
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(typeof svg).toBe('string');
    });

    it('should generate SVG with custom options', async () => {
      const svg = await generateQrSvg('https://example.com', {
        size: 512,
        errorCorrectionLevel: 'H',
        color: { dark: '#000080', light: '#FFFFFF' }
      });
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('width="512"');
    });

    it('should handle empty payload gracefully', async () => {
      await expect(generateQrSvg('')).rejects.toThrow();
    });
  });

  describe('validateQrPayload', () => {
    it('should validate empty payload', () => {
      const result = validateQrPayload('');
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Payload cannot be empty');
    });

    it('should validate valid URL', () => {
      const result = validateQrPayload('https://example.com', 'url');
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about invalid URL', () => {
      const result = validateQrPayload('not-a-url', 'url');
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Invalid URL format');
    });

    it('should validate email format', () => {
      const validEmail = validateQrPayload('test@example.com', 'email');
      const invalidEmail = validateQrPayload('invalid-email', 'email');
      
      expect(validEmail.isValid).toBe(true);
      expect(invalidEmail.isValid).toBe(false);
    });

    it('should warn about very long payloads', () => {
      const longPayload = 'a'.repeat(3000);
      const result = validateQrPayload(longPayload);
      
      expect(result.warnings.some(w => w.includes('very long'))).toBe(true);
    });
  });
});