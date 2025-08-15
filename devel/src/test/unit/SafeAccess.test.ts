import { describe, it, expect, beforeEach } from 'vitest';
import { SafeAccess, safeAccess, type AccessOptions } from '@/shared/utils/SafeAccess';

describe('SafeAccess', () => {
  let testData: any;

  beforeEach(() => {
    // Mock D&D Beyond character data structure
    testData = {
      id: 12345,
      name: 'Test Character',
      race: {
        fullName: 'Human',
        definition: {
          name: 'Human',
          entityTypeId: '1234567890',
          traits: {
            powerfulBuild: false,
            size: 'Medium'
          }
        },
        racialTraits: [
          {
            definition: {
              name: 'Extra Language',
              description: 'You can speak one extra language.'
            }
          }
        ]
      },
      classes: [
        {
          definition: {
            name: 'Fighter',
            hitDie: 10
          },
          level: 5,
          subclassDefinition: {
            name: 'Champion',
            features: {
              improved: {
                criticalHit: 19
              }
            }
          }
        }
      ],
      stats: [
        { id: 1, name: 'strength', value: 15 },
        { id: 2, name: 'dexterity', value: 14 }
      ],
      preferences: {
        privacy: {
          showStats: true,
          showInventory: false
        }
      },
      // Test case sensitivity
      CaseSensitive: {
        TestValue: 'should find this'
      },
      // Test array access
      inventory: [
        {
          definition: {
            name: 'Longsword',
            type: 'Weapon'
          },
          quantity: 1
        }
      ]
    };
  });

  describe('get() method', () => {
    it('should access simple properties', () => {
      expect(SafeAccess.get(testData, 'id')).toBe(12345);
      expect(SafeAccess.get(testData, 'name')).toBe('Test Character');
    });

    it('should access nested properties', () => {
      expect(SafeAccess.get(testData, 'race.fullName')).toBe('Human');
      expect(SafeAccess.get(testData, 'race.definition.name')).toBe('Human');
      expect(SafeAccess.get(testData, 'race.definition.entityTypeId')).toBe('1234567890');
    });

    it('should access deeply nested properties', () => {
      expect(SafeAccess.get(testData, 'race.definition.traits.size')).toBe('Medium');
      expect(SafeAccess.get(testData, 'race.definition.traits.powerfulBuild')).toBe(false);
      expect(SafeAccess.get(testData, 'classes.0.subclassDefinition.features.improved.criticalHit')).toBe(19);
    });

    it('should return default value for non-existent paths', () => {
      expect(SafeAccess.get(testData, 'nonexistent')).toBe(null);
      expect(SafeAccess.get(testData, 'race.nonexistent')).toBe(null);
      expect(SafeAccess.get(testData, 'race.definition.nonexistent.deeply.nested')).toBe(null);
    });

    it('should return custom default values', () => {
      expect(SafeAccess.get(testData, 'nonexistent', 'default')).toBe('default');
      expect(SafeAccess.get(testData, 'race.nonexistent', 0)).toBe(0);
      expect(SafeAccess.get(testData, 'deep.nonexistent.path', [])).toEqual([]);
    });

    it('should handle null and undefined inputs', () => {
      expect(SafeAccess.get(null, 'any.path')).toBe(null);
      expect(SafeAccess.get(undefined, 'any.path')).toBe(null);
      expect(SafeAccess.get('string', 'any.path')).toBe(null);
      expect(SafeAccess.get(123, 'any.path')).toBe(null);
    });

    it('should handle invalid paths', () => {
      expect(SafeAccess.get(testData, '')).toBe(null);
      expect(SafeAccess.get(testData, null as any)).toBe(null);
      expect(SafeAccess.get(testData, undefined as any)).toBe(null);
    });

    it('should handle array indices in paths', () => {
      expect(SafeAccess.get(testData, 'stats.0.name')).toBe('strength');
      expect(SafeAccess.get(testData, 'stats.1.value')).toBe(14);
      expect(SafeAccess.get(testData, 'classes.0.level')).toBe(5);
      expect(SafeAccess.get(testData, 'race.racialTraits.0.definition.name')).toBe('Extra Language');
    });

    it('should handle out-of-bounds array access', () => {
      expect(SafeAccess.get(testData, 'stats.10.name')).toBe(null);
      expect(SafeAccess.get(testData, 'classes.5.level')).toBe(null);
    });

    it('should respect maxDepth option', () => {
      const options: AccessOptions = { maxDepth: 2 };
      expect(SafeAccess.get(testData, 'race.definition', null, options)).not.toBe(null);
      expect(SafeAccess.get(testData, 'race.definition.name', null, options)).toBe(null);
    });

    it('should handle case insensitive access when configured', () => {
      const options: AccessOptions = { caseSensitive: false };
      expect(SafeAccess.get(testData, 'casesensitive.testvalue', null, options)).toBe('should find this');
      expect(SafeAccess.get(testData, 'CASESENSITIVE.TESTVALUE', null, options)).toBe('should find this');
    });

    it('should be case sensitive by default', () => {
      expect(SafeAccess.get(testData, 'casesensitive.testvalue')).toBe(null);
      expect(SafeAccess.get(testData, 'CaseSensitive.TestValue')).toBe('should find this');
    });

    it('should handle accessing properties on primitive values', () => {
      const data = {
        stringValue: 'hello',
        numberValue: 42,
        booleanValue: true
      };
      
      expect(SafeAccess.get(data, 'stringValue.length')).toBe(null);
      expect(SafeAccess.get(data, 'numberValue.toFixed')).toBe(null);
      expect(SafeAccess.get(data, 'booleanValue.toString')).toBe(null);
    });

    it('should handle throwOnError option', () => {
      const options: AccessOptions = { throwOnError: true, logWarnings: false };
      
      // These should not throw
      expect(() => SafeAccess.get(testData, 'name', null, options)).not.toThrow();
      expect(() => SafeAccess.get(testData, 'race.definition.name', null, options)).not.toThrow();
      
      // Test maxDepth error
      const deepOptions: AccessOptions = { throwOnError: true, maxDepth: 1, logWarnings: false };
      expect(() => SafeAccess.get(testData, 'race.definition.name', null, deepOptions)).toThrow();
    });

    it('should preserve boolean false and number 0 values', () => {
      expect(SafeAccess.get(testData, 'race.definition.traits.powerfulBuild')).toBe(false);
      
      const dataWithZero = { stats: { strength: 0 } };
      expect(SafeAccess.get(dataWithZero, 'stats.strength')).toBe(0);
    });
  });

  describe('getWithResult() method', () => {
    it('should return detailed result for successful access', () => {
      const result = SafeAccess.getWithResult(testData, 'race.definition.name');
      
      expect(result.found).toBe(true);
      expect(result.value).toBe('Human');
      expect(result.path).toBe('race.definition.name');
      expect(result.depth).toBe(3);
      expect(result.error).toBeUndefined();
    });

    it('should return detailed result for failed access', () => {
      const result = SafeAccess.getWithResult(testData, 'race.nonexistent.path');
      
      expect(result.found).toBe(false);
      expect(result.value).toBe(null);
      expect(result.path).toBe('race.nonexistent.path');
      expect(result.depth).toBe(2);
      expect(result.error).toContain('nonexistent');
    });

    it('should return error for invalid inputs', () => {
      const nullResult = SafeAccess.getWithResult(null, 'any.path');
      expect(nullResult.found).toBe(false);
      expect(nullResult.error).toBe('Invalid object provided');

      const pathResult = SafeAccess.getWithResult(testData, '');
      expect(pathResult.found).toBe(false);
      expect(pathResult.error).toBe('Invalid path provided');
    });

    it('should return error for depth exceeded', () => {
      const result = SafeAccess.getWithResult(testData, 'very.deep.nested.path', { maxDepth: 2 });
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('depth exceeds maximum');
      expect(result.depth).toBe(4);
    });
  });

  describe('has() method', () => {
    it('should return true for existing paths', () => {
      expect(SafeAccess.has(testData, 'name')).toBe(true);
      expect(SafeAccess.has(testData, 'race.fullName')).toBe(true);
      expect(SafeAccess.has(testData, 'race.definition.traits.size')).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      expect(SafeAccess.has(testData, 'nonexistent')).toBe(false);
      expect(SafeAccess.has(testData, 'race.nonexistent')).toBe(false);
      expect(SafeAccess.has(testData, 'race.definition.nonexistent.path')).toBe(false);
    });

    it('should return false for null/undefined values', () => {
      const dataWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        nested: {
          nullValue: null
        }
      };

      expect(SafeAccess.has(dataWithNulls, 'nullValue')).toBe(false);
      expect(SafeAccess.has(dataWithNulls, 'undefinedValue')).toBe(false);
      expect(SafeAccess.has(dataWithNulls, 'nested.nullValue')).toBe(false);
    });

    it('should return true for false and 0 values', () => {
      expect(SafeAccess.has(testData, 'race.definition.traits.powerfulBuild')).toBe(true);
      
      const dataWithFalsy = {
        falseValue: false,
        zeroValue: 0,
        emptyString: ''
      };

      expect(SafeAccess.has(dataWithFalsy, 'falseValue')).toBe(true);
      expect(SafeAccess.has(dataWithFalsy, 'zeroValue')).toBe(true);
      expect(SafeAccess.has(dataWithFalsy, 'emptyString')).toBe(true);
    });
  });

  describe('getMultiple() method', () => {
    it('should get multiple paths at once', () => {
      const paths = ['name', 'race.fullName', 'classes.0.level', 'nonexistent'];
      const result = SafeAccess.getMultiple(testData, paths);

      expect(result).toEqual({
        'name': 'Test Character',
        'race.fullName': 'Human',
        'classes.0.level': 5,
        'nonexistent': null
      });
    });

    it('should handle empty paths array', () => {
      const result = SafeAccess.getMultiple(testData, []);
      expect(result).toEqual({});
    });
  });

  describe('set() method', () => {
    let mutableData: any;

    beforeEach(() => {
      mutableData = {
        existing: {
          nested: {
            value: 'old'
          }
        }
      };
    });

    it('should set simple properties', () => {
      expect(SafeAccess.set(mutableData, 'newProp', 'new value')).toBe(true);
      expect(mutableData.newProp).toBe('new value');
    });

    it('should set nested properties', () => {
      expect(SafeAccess.set(mutableData, 'existing.nested.value', 'new value')).toBe(true);
      expect(mutableData.existing.nested.value).toBe('new value');
    });

    it('should create intermediate objects', () => {
      expect(SafeAccess.set(mutableData, 'new.nested.deep.value', 'created')).toBe(true);
      expect(mutableData.new.nested.deep.value).toBe('created');
    });

    it('should handle invalid inputs', () => {
      expect(SafeAccess.set(null, 'any.path', 'value')).toBe(false);
      expect(SafeAccess.set(mutableData, '', 'value')).toBe(false);
    });

    it('should respect maxDepth', () => {
      expect(SafeAccess.set(mutableData, 'very.deep.nested.path', 'value', { maxDepth: 2 })).toBe(false);
    });
  });

  describe('delete() method', () => {
    let mutableData: any;

    beforeEach(() => {
      mutableData = {
        topLevel: 'value',
        nested: {
          prop: 'value',
          deep: {
            prop: 'deep value'
          }
        }
      };
    });

    it('should delete top-level properties', () => {
      expect(SafeAccess.delete(mutableData, 'topLevel')).toBe(true);
      expect('topLevel' in mutableData).toBe(false);
    });

    it('should delete nested properties', () => {
      expect(SafeAccess.delete(mutableData, 'nested.prop')).toBe(true);
      expect('prop' in mutableData.nested).toBe(false);
      expect(mutableData.nested.deep).toBeDefined();
    });

    it('should delete deeply nested properties', () => {
      expect(SafeAccess.delete(mutableData, 'nested.deep.prop')).toBe(true);
      expect('prop' in mutableData.nested.deep).toBe(false);
    });

    it('should return false for non-existent properties', () => {
      expect(SafeAccess.delete(mutableData, 'nonexistent')).toBe(false);
      expect(SafeAccess.delete(mutableData, 'nested.nonexistent')).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(SafeAccess.delete(null, 'any.path')).toBe(false);
      expect(SafeAccess.delete(mutableData, '')).toBe(false);
    });
  });

  describe('getAllPaths() method', () => {
    it('should return all paths in the object', () => {
      const simpleData = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      };

      const paths = SafeAccess.getAllPaths(simpleData, 10);
      expect(paths).toContain('a');
      expect(paths).toContain('b');
      expect(paths).toContain('b.c');
      expect(paths).toContain('b.d');
      expect(paths).toContain('b.d.e');
    });

    it('should respect maxDepth parameter', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: 'deep'
            }
          }
        }
      };

      const shallowPaths = SafeAccess.getAllPaths(deepData, 2);
      const deepPaths = SafeAccess.getAllPaths(deepData, 4);

      expect(shallowPaths.length).toBeLessThan(deepPaths.length);
      expect(shallowPaths).toContain('level1');
      expect(shallowPaths).toContain('level1.level2');
      expect(shallowPaths).not.toContain('level1.level2.level3');
    });

    it('should return sorted paths', () => {
      const data = {
        z: 1,
        a: 2,
        m: {
          z: 3,
          a: 4
        }
      };

      const paths = SafeAccess.getAllPaths(data);
      const sortedPaths = [...paths].sort();
      expect(paths).toEqual(sortedPaths);
    });

    it('should handle invalid inputs', () => {
      expect(SafeAccess.getAllPaths(null)).toEqual([]);
      expect(SafeAccess.getAllPaths(undefined)).toEqual([]);
      expect(SafeAccess.getAllPaths('string')).toEqual([]);
    });
  });

  describe('Legacy compatibility', () => {
    describe('safeAccess() function', () => {
      it('should work identically to SafeAccess.get()', () => {
        const testCases = [
          { path: 'name', expected: 'Test Character' },
          { path: 'race.fullName', expected: 'Human' },
          { path: 'race.definition.name', expected: 'Human' },
          { path: 'nonexistent', expected: null },
          { path: 'race.nonexistent', expected: null }
        ];

        testCases.forEach(({ path, expected }) => {
          const legacyResult = safeAccess(testData, path);
          const modernResult = SafeAccess.get(testData, path);
          expect(legacyResult).toBe(expected);
          expect(legacyResult).toBe(modernResult);
        });
      });

      it('should handle custom default values', () => {
        expect(safeAccess(testData, 'nonexistent', 'default')).toBe('default');
        expect(safeAccess(testData, 'race.nonexistent', 42)).toBe(42);
        expect(safeAccess(testData, 'deep.nonexistent.path', [])).toEqual([]);
      });

      it('should maintain backward compatibility with existing code', () => {
        // Test specific patterns that existing code might rely on
        expect(safeAccess(testData, 'race.definition.entityTypeId')).toBe('1234567890');
        expect(safeAccess(testData, 'stats.0.name')).toBe('strength');
        expect(safeAccess(testData, 'preferences.privacy.showStats')).toBe(true);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(SafeAccess.get(circular, 'name')).toBe('test');
      expect(SafeAccess.get(circular, 'self.name')).toBe('test');
      expect(SafeAccess.get(circular, 'self.self.name')).toBe('test');
    });

    it('should handle very deep nesting within limits', () => {
      let deepObj: any = { level: 0 };
      let current = deepObj;
      
      for (let i = 1; i <= 20; i++) {
        current.next = { level: i };
        current = current.next;
      }
      
      expect(SafeAccess.get(deepObj, 'next.next.next.level')).toBe(3);
      expect(SafeAccess.get(deepObj, 'next.next.next.next.next.level')).toBe(5);
    });

    it('should handle special characters in property names', () => {
      const specialData = {
        'property-with-dashes': 'dash value',
        'property.with.dots': 'dot value',
        'property with spaces': 'space value',
        'property_with_underscores': 'underscore value'
      };

      expect(SafeAccess.get(specialData, 'property-with-dashes')).toBe('dash value');
      expect(SafeAccess.get(specialData, 'property_with_underscores')).toBe('underscore value');
      // Note: Properties with dots in the name are problematic with dot notation
    });

    it('should handle mixed array and object access', () => {
      const mixedData = {
        users: [
          { name: 'Alice', preferences: { theme: 'dark' } },
          { name: 'Bob', preferences: { theme: 'light' } }
        ]
      };

      expect(SafeAccess.get(mixedData, 'users.0.name')).toBe('Alice');
      expect(SafeAccess.get(mixedData, 'users.1.preferences.theme')).toBe('light');
      expect(SafeAccess.get(mixedData, 'users.2.name')).toBe(null);
    });

    it('should handle performance for reasonable object sizes', () => {
      const largeObj: any = {};
      
      // Create a moderately complex object
      for (let i = 0; i < 100; i++) {
        largeObj[`prop${i}`] = {
          id: i,
          nested: {
            value: `value${i}`,
            deep: {
              property: `deep${i}`
            }
          }
        };
      }

      const start = performance.now();
      
      // Test multiple accesses
      for (let i = 0; i < 50; i++) {
        SafeAccess.get(largeObj, `prop${i}.nested.deep.property`);
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Should complete quickly
      expect(SafeAccess.get(largeObj, 'prop25.nested.deep.property')).toBe('deep25');
    });
  });
});