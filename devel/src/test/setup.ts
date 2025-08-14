// Test setup and global mocks
import { beforeEach } from 'vitest';

// Mock DOM APIs that aren't available in jsdom
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now()
  }
});

// Reset global state before each test
beforeEach(() => {
  // Reset any global variables
  if (typeof window !== 'undefined') {
    window.startXML = '';
    window.allXML = '';
    window.pcFilename = '';
  }
});