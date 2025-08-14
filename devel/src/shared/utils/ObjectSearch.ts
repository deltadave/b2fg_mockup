/**
 * ObjectSearch Service
 * 
 * Provides utilities for recursively searching through complex objects.
 * Migrated from utilities.js getObjects() function with modern TypeScript 
 * implementation and improved type safety.
 */

export interface SearchCriteria {
  key?: string;
  value?: any;
  matchMode?: 'exact' | 'partial' | 'regex';
}

export interface SearchOptions {
  maxDepth?: number;
  includeArrays?: boolean;
  caseSensitive?: boolean;
  excludeKeys?: string[];
}

export class ObjectSearch {
  /**
   * Recursively search through an object for properties matching key/value criteria
   * Migrated from legacy getObjects() function with enhanced capabilities
   * 
   * @param obj - Object to search through
   * @param key - Property key to match (empty string matches any key)
   * @param val - Property value to match (empty string matches any value)
   * @returns Array of objects that match the criteria
   */
  static find<T = any>(obj: unknown, key: string = '', val: any = ''): T[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    const objects: T[] = [];
    const stack = [obj];
    const visited = new WeakSet(); // Prevent infinite loops with circular references
    
    while (stack.length > 0) {
      const current = stack.pop();
      
      if (!current || typeof current !== 'object' || visited.has(current)) {
        continue;
      }
      
      visited.add(current);
      
      for (const [currentKey, currentValue] of Object.entries(current)) {
        // Handle nested objects/arrays
        if (typeof currentValue === 'object' && currentValue !== null) {
          stack.push(currentValue);
        }
        
        // Check matching criteria (preserving legacy behavior)
        const keyMatches = key === '' || currentKey === key;
        const valueMatches = val === '' || currentValue === val;
        
        if ((keyMatches && valueMatches) || 
            (key === currentKey && val === '') ||
            (val === currentValue && key === '')) {
          // Avoid duplicates
          if (!objects.includes(current as T)) {
            objects.push(current as T);
          }
        }
      }
    }
    
    return objects;
  }

  /**
   * Enhanced search with additional options and type safety
   * 
   * @param obj - Object to search through
   * @param criteria - Search criteria object
   * @param options - Additional search options
   * @returns Array of matching objects with type safety
   */
  static findAdvanced<T = any>(
    obj: unknown, 
    criteria: SearchCriteria, 
    options: SearchOptions = {}
  ): T[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    const {
      maxDepth = 50,
      includeArrays = true,
      caseSensitive = true,
      excludeKeys = []
    } = options;

    const objects: T[] = [];
    const stack: Array<{ obj: any; depth: number }> = [{ obj, depth: 0 }];
    const visited = new WeakSet();
    
    while (stack.length > 0) {
      const { obj: current, depth } = stack.pop()!;
      
      if (!current || 
          typeof current !== 'object' || 
          visited.has(current) || 
          depth > maxDepth) {
        continue;
      }
      
      visited.add(current);
      
      for (const [currentKey, currentValue] of Object.entries(current)) {
        // Skip excluded keys
        if (excludeKeys.includes(currentKey)) {
          continue;
        }

        // Handle nested objects/arrays
        if (typeof currentValue === 'object' && currentValue !== null) {
          if (includeArrays || !Array.isArray(currentValue)) {
            stack.push({ obj: currentValue, depth: depth + 1 });
          }
        }
        
        // Advanced matching logic
        if (this.matchesCriteria(currentKey, currentValue, criteria, caseSensitive)) {
          if (!objects.includes(current as T)) {
            objects.push(current as T);
          }
        }
      }
    }
    
    return objects;
  }

  /**
   * Find objects by entity type ID (common D&D Beyond pattern)
   * 
   * @param obj - Object to search through
   * @param entityTypeId - The entityTypeId to match
   * @returns Array of matching objects
   */
  static findByEntityType<T = any>(obj: unknown, entityTypeId: string | number): T[] {
    return this.find<T>(obj, 'entityTypeId', entityTypeId.toString());
  }

  /**
   * Find objects by type field (common D&D Beyond pattern)
   * 
   * @param obj - Object to search through
   * @param type - The type value to match
   * @returns Array of matching objects
   */
  static findByType<T = any>(obj: unknown, type: string): T[] {
    return this.find<T>(obj, 'type', type);
  }

  /**
   * Find all objects containing a specific value (any key)
   * 
   * @param obj - Object to search through
   * @param value - The value to find
   * @returns Array of objects containing the value
   */
  static findByValue<T = any>(obj: unknown, value: any): T[] {
    return this.find<T>(obj, '', value);
  }

  /**
   * Find all objects with a specific key (any value)
   * 
   * @param obj - Object to search through
   * @param key - The key to find
   * @returns Array of objects containing the key
   */
  static findByKey<T = any>(obj: unknown, key: string): T[] {
    return this.find<T>(obj, key, '');
  }

  /**
   * Check if key/value combination matches criteria
   */
  private static matchesCriteria(
    key: string, 
    value: any, 
    criteria: SearchCriteria,
    caseSensitive: boolean
  ): boolean {
    const { key: targetKey, value: targetValue, matchMode = 'exact' } = criteria;

    // Key matching
    let keyMatches = true;
    if (targetKey !== undefined) {
      const keyToCheck = caseSensitive ? key : key.toLowerCase();
      const targetKeyToCheck = caseSensitive ? targetKey : targetKey.toLowerCase();
      
      switch (matchMode) {
        case 'partial':
          keyMatches = keyToCheck.includes(targetKeyToCheck);
          break;
        case 'regex':
          keyMatches = new RegExp(targetKeyToCheck, caseSensitive ? 'g' : 'gi').test(keyToCheck);
          break;
        default:
          keyMatches = keyToCheck === targetKeyToCheck;
      }
    }

    // Value matching
    let valueMatches = true;
    if (targetValue !== undefined) {
      if (typeof value === 'string' && typeof targetValue === 'string') {
        const valueToCheck = caseSensitive ? value : value.toLowerCase();
        const targetValueToCheck = caseSensitive ? targetValue : targetValue.toLowerCase();
        
        switch (matchMode) {
          case 'partial':
            valueMatches = valueToCheck.includes(targetValueToCheck);
            break;
          case 'regex':
            valueMatches = new RegExp(targetValueToCheck, caseSensitive ? 'g' : 'gi').test(valueToCheck);
            break;
          default:
            valueMatches = valueToCheck === targetValueToCheck;
        }
      } else {
        valueMatches = value === targetValue;
      }
    }

    return keyMatches && valueMatches;
  }

  /**
   * Get all unique keys from an object tree
   * Useful for understanding object structure
   */
  static getAllKeys(obj: unknown, maxDepth: number = 10): string[] {
    const keys = new Set<string>();
    const stack: Array<{ obj: any; depth: number }> = [{ obj, depth: 0 }];
    const visited = new WeakSet();
    
    while (stack.length > 0) {
      const { obj: current, depth } = stack.pop()!;
      
      if (!current || 
          typeof current !== 'object' || 
          visited.has(current) || 
          depth > maxDepth) {
        continue;
      }
      
      visited.add(current);
      
      for (const [key, value] of Object.entries(current)) {
        keys.add(key);
        
        if (typeof value === 'object' && value !== null) {
          stack.push({ obj: value, depth: depth + 1 });
        }
      }
    }
    
    return Array.from(keys).sort();
  }
}

// Legacy compatibility function for gradual migration
export function getObjects(obj: unknown, key: string = '', val: any = ''): any[] {
  return ObjectSearch.find(obj, key, val);
}