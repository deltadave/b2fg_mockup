import { describe, it, expect } from 'vitest';

describe('Build System', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to DOM APIs', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('should have performance API mocked', () => {
    expect(typeof window.performance.now).toBe('function');
    expect(window.performance.now()).toBeGreaterThan(0);
  });
});