/**
 * SafeAccess Utility
 * 
 * Provides utilities for safely accessing nested object properties with dot notation.
 * Migrated from legacy safeAccess() function in utilities.js and characterParser.js
 * with modern TypeScript implementation and enhanced type safety.
 */

export interface AccessOptions {
  throwOnError?: boolean;
  logWarnings?: boolean;
  maxDepth?: number;
  caseSensitive?: boolean;
}

export interface AccessResult<T> {
  value: T | null;
  found: boolean;
  path: string;
  depth: number;
  error?: string;
}

export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : unknown
  : P extends keyof T
    ? T[P]
    : unknown;

export class SafeAccess {
  /**
   * Safely access a nested property using dot notation
   * Migrated from legacy safeAccess() function with enhanced capabilities
   * 
   * @param obj - Object to access
   * @param path - Dot-separated path (e.g., "character.race.name")
   * @param defaultValue - Value to return if path doesn't exist
   * @param options - Access options for advanced behavior
   * @returns Value at path or defaultValue
   */
  static get<T = any>(
    obj: unknown, 
    path: string, 
    defaultValue: T | null = null,
    options: AccessOptions = {}
  ): T | null {
    const {
      throwOnError = false,
      logWarnings = true,
      maxDepth = 50,
      caseSensitive = true
    } = options;

    try {
      if (!obj || typeof obj !== 'object') {
        return defaultValue;
      }

      if (!path || typeof path !== 'string') {
        return defaultValue;
      }

      // Split path and traverse object
      const keys = path.split('.');
      
      if (keys.length > maxDepth) {
        const error = `Path depth exceeds maximum (${maxDepth}): ${path}`;
        if (logWarnings) {
          console.warn(error);
        }
        if (throwOnError) {
          throw new Error(error);
        }
        return defaultValue;
      }

      let current: any = obj;
      let traversedPath = '';

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        traversedPath += (i > 0 ? '.' : '') + key;

        if (current === null || current === undefined) {
          return defaultValue;
        }

        if (typeof current !== 'object') {
          return defaultValue;
        }

        // Handle case sensitivity
        let actualKey = key;
        if (!caseSensitive && !(key in current)) {
          // Try to find case-insensitive match
          const foundKey = Object.keys(current).find(k => 
            k.toLowerCase() === key.toLowerCase()
          );
          if (foundKey) {
            actualKey = foundKey;
          }
        }

        if (!(actualKey in current)) {
          return defaultValue;
        }

        current = current[actualKey];
      }

      // Return the found value or defaultValue if undefined/null
      return current !== undefined && current !== null ? current : defaultValue;

    } catch (error) {
      const errorMessage = `Safe access failed for path: ${path}`;
      
      if (logWarnings) {
        console.warn(errorMessage, error);
      }
      
      if (throwOnError) {
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      return defaultValue;
    }
  }

  /**
   * Enhanced safe access with detailed result information
   * 
   * @param obj - Object to access
   * @param path - Dot-separated path
   * @param options - Access options
   * @returns Detailed access result
   */
  static getWithResult<T = any>(
    obj: unknown, 
    path: string,
    options: AccessOptions = {}
  ): AccessResult<T> {
    const { maxDepth = 50, caseSensitive = true } = options;

    if (!obj || typeof obj !== 'object') {
      return {
        value: null,
        found: false,
        path,
        depth: 0,
        error: 'Invalid object provided'
      };
    }

    if (!path || typeof path !== 'string') {
      return {
        value: null,
        found: false,
        path,
        depth: 0,
        error: 'Invalid path provided'
      };
    }

    try {
      const keys = path.split('.');
      
      if (keys.length > maxDepth) {
        return {
          value: null,
          found: false,
          path,
          depth: keys.length,
          error: `Path depth exceeds maximum (${maxDepth})`
        };
      }

      let current: any = obj;
      let depth = 0;

      for (const key of keys) {
        depth++;
        
        if (current === null || current === undefined || typeof current !== 'object') {
          return {
            value: null,
            found: false,
            path,
            depth,
            error: `Cannot access property '${key}' on ${typeof current}`
          };
        }

        // Handle case sensitivity
        let actualKey = key;
        if (!caseSensitive && !(key in current)) {
          const foundKey = Object.keys(current).find(k => 
            k.toLowerCase() === key.toLowerCase()
          );
          if (foundKey) {
            actualKey = foundKey;
          }
        }

        if (!(actualKey in current)) {
          return {
            value: null,
            found: false,
            path,
            depth,
            error: `Property '${key}' not found`
          };
        }

        current = current[actualKey];
      }

      return {
        value: current,
        found: true,
        path,
        depth,
        error: undefined
      };

    } catch (error) {
      return {
        value: null,
        found: false,
        path,
        depth: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if a path exists in an object
   * 
   * @param obj - Object to check
   * @param path - Dot-separated path
   * @param options - Access options
   * @returns true if path exists and has a non-null/undefined value
   */
  static has(obj: unknown, path: string, options: AccessOptions = {}): boolean {
    const result = this.getWithResult(obj, path, options);
    return result.found && result.value !== null && result.value !== undefined;
  }

  /**
   * Get multiple paths from an object safely
   * 
   * @param obj - Object to access
   * @param paths - Array of dot-separated paths
   * @param options - Access options
   * @returns Object with path keys and their values
   */
  static getMultiple<T = any>(
    obj: unknown, 
    paths: string[], 
    options: AccessOptions = {}
  ): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const path of paths) {
      result[path] = this.get<T>(obj, path, null, options);
    }
    
    return result;
  }

  /**
   * Set a value at a nested path, creating intermediate objects as needed
   * 
   * @param obj - Object to modify
   * @param path - Dot-separated path
   * @param value - Value to set
   * @param options - Access options
   * @returns true if successful, false otherwise
   */
  static set(
    obj: any, 
    path: string, 
    value: any, 
    options: AccessOptions = {}
  ): boolean {
    const { maxDepth = 50, caseSensitive = true } = options;

    try {
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      if (!path || typeof path !== 'string') {
        return false;
      }

      const keys = path.split('.');
      
      if (keys.length > maxDepth) {
        return false;
      }

      let current = obj;

      // Navigate to the parent of the target property
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
          current[key] = {};
        }
        
        current = current[key];
      }

      // Set the final value
      const finalKey = keys[keys.length - 1];
      current[finalKey] = value;
      
      return true;

    } catch (error) {
      if (options.logWarnings) {
        console.warn(`Safe set failed for path: ${path}`, error);
      }
      return false;
    }
  }

  /**
   * Delete a property at a nested path
   * 
   * @param obj - Object to modify
   * @param path - Dot-separated path
   * @param options - Access options
   * @returns true if successful, false otherwise
   */
  static delete(obj: any, path: string, options: AccessOptions = {}): boolean {
    try {
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      const keys = path.split('.');
      const parentPath = keys.slice(0, -1).join('.');
      const finalKey = keys[keys.length - 1];

      if (keys.length === 1) {
        if (finalKey in obj) {
          delete obj[finalKey];
          return true;
        }
        return false;
      }

      const parent = this.get(obj, parentPath, null, options);
      if (parent && typeof parent === 'object' && finalKey in parent) {
        delete (parent as any)[finalKey];
        return true;
      }

      return false;

    } catch (error) {
      if (options.logWarnings) {
        console.warn(`Safe delete failed for path: ${path}`, error);
      }
      return false;
    }
  }

  /**
   * Get all paths that exist in an object up to a certain depth
   * 
   * @param obj - Object to analyze
   * @param maxDepth - Maximum depth to traverse
   * @param prefix - Internal prefix for recursion
   * @returns Array of all valid paths
   */
  static getAllPaths(obj: unknown, maxDepth: number = 10, prefix: string = ''): string[] {
    const paths: string[] = [];

    if (!obj || typeof obj !== 'object' || maxDepth <= 0) {
      return paths;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);

      if (typeof value === 'object' && value !== null && maxDepth > 1) {
        const nestedPaths = this.getAllPaths(value, maxDepth - 1, currentPath);
        paths.push(...nestedPaths);
      }
    }

    return paths.sort();
  }
}

// Legacy compatibility function for gradual migration
export function safeAccess(obj: unknown, path: string, defaultValue: any = null): any {
  return SafeAccess.get(obj, path, defaultValue);
}