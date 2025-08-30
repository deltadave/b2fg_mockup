/**
 * ID Generation Utilities
 * 
 * Provides utilities for generating unique IDs for Foundry VTT entities.
 * Uses crypto-random values with fallback for compatibility.
 */

/**
 * Generate a random Foundry VTT-style ID
 * Format: 16-character alphanumeric string (like "abc123def456gh78")
 */
export function generateId(): string {
  // Use crypto.getRandomValues if available (browser/secure context)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback using Math.random (less secure but compatible)
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate a deterministic ID based on input string
 * Useful for consistent IDs across imports
 */
export function generateDeterministicId(input: string): string {
  // Simple hash function for consistent ID generation
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Pad or truncate to 16 characters
  if (hexHash.length >= 16) {
    return hexHash.substring(0, 16);
  } else {
    // Extend with repeated pattern
    return (hexHash + hexHash + hexHash).substring(0, 16);
  }
}

/**
 * Validate if a string is a valid Foundry VTT ID format
 */
export function isValidFoundryId(id: string): boolean {
  return /^[a-zA-Z0-9]{16}$/.test(id);
}