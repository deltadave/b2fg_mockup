import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterFetcher } from '@/domain/character/services/CharacterFetcher';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController for timeout tests
global.AbortController = vi.fn(() => ({
  abort: vi.fn(),
  signal: { aborted: false }
})) as any;

// Mock setTimeout and clearTimeout
global.setTimeout = vi.fn((callback, delay) => {
  if (delay === 0) {
    callback();
  }
  return 1;
}) as any;
global.clearTimeout = vi.fn();

describe('CharacterFetcher', () => {
  let fetcher: CharacterFetcher;

  beforeEach(() => {
    fetcher = new CharacterFetcher();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateCharacterID', () => {
    it('should validate D&D Beyond URL format', () => {
      const result = fetcher.validateCharacterID('https://www.dndbeyond.com/characters/12345678');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('12345678');
    });

    it('should validate character ID from partial URL', () => {
      const result = fetcher.validateCharacterID('dndbeyond.com/characters/87654321');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('87654321');
    });

    it('should validate direct character ID', () => {
      const result = fetcher.validateCharacterID('123456789');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('123456789');
    });

    it('should handle leading/trailing whitespace', () => {
      const result = fetcher.validateCharacterID('  12345678  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('12345678');
    });

    it('should reject empty input', () => {
      const result = fetcher.validateCharacterID('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Character ID is required');
    });

    it('should reject null/undefined input', () => {
      const result1 = fetcher.validateCharacterID(null as any);
      const result2 = fetcher.validateCharacterID(undefined as any);
      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
    });

    it('should reject invalid formats', () => {
      const testCases = [
        'abc123',
        '123abc',
        'not-a-character-id',
        'dndbeyond.com/profile/12345'
      ];

      testCases.forEach(testCase => {
        const result = fetcher.validateCharacterID(testCase);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid format');
      });
    });
  });

  describe('fetchCharacter', () => {
    const mockCharacterData = {
      id: 12345678,
      name: 'Test Character',
      race: { fullName: 'Human' },
      classes: [{ definition: { name: 'Fighter' }, level: 5 }],
      stats: [{ id: 1, value: 15 }],
      bonusStats: [{ id: 1, value: 2 }]
    };

    beforeEach(() => {
      // Default successful response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCharacterData)
      });
    });

    it('should successfully fetch character data', async () => {
      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharacterData);
      expect(result.error).toBeUndefined();
    });

    it('should construct correct fetch URL', async () => {
      await fetcher.fetchCharacter('12345678');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://uakari-indigo.fly.dev/https://character-service.dndbeyond.com/character/v5/character/12345678',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': expect.stringContaining('Mozilla')
          })
        })
      );
    });

    it('should handle character ID validation failure', async () => {
      const result = await fetcher.fetchCharacter('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid format');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle 404 character not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Character not found');
      expect(result.statusCode).toBe(404);
    });

    it('should handle 401 unauthorized (private character)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not public');
    });

    it('should handle 403 forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });

    it('should handle 429 rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });

    it('should validate character data structure', async () => {
      const invalidData = { id: 'not-a-number', name: null };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(invalidData)
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid character data');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle network errors with retry', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('NetworkError'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockCharacterData)
        });

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharacterData);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 401/403/404 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await fetcher.fetchCharacter('12345678');
      
      // Should only be called once (no retries for auth errors)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('AbortError'));

      const result = await fetcher.fetchCharacter('12345678');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should extract character ID from URLs during fetch', async () => {
      const result = await fetcher.fetchCharacter('https://www.dndbeyond.com/characters/87654321');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/87654321'),
        expect.any(Object)
      );
    });
  });

  describe('checkServiceHealth', () => {
    it('should return true when proxy is available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await fetcher.checkServiceHealth();
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://uakari-indigo.fly.dev/',
        expect.objectContaining({
          method: 'HEAD'
        })
      );
    });

    it('should return false when proxy is unavailable', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const result = await fetcher.checkServiceHealth();
      
      expect(result).toBe(false);
    });

    it('should return false when proxy returns error status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await fetcher.checkServiceHealth();
      
      expect(result).toBe(false);
    });
  });
});