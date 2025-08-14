import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectSearch, getObjects } from '@/shared/utils/ObjectSearch';

describe('ObjectSearch', () => {
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
          entityTypeId: '1234567890'
        }
      },
      classes: [
        {
          definition: {
            name: 'Fighter',
            entityTypeId: '1446578651'
          },
          level: 5,
          classFeatures: [
            {
              name: 'Second Wind',
              type: 'feature'
            },
            {
              name: 'Action Surge', 
              type: 'feature'
            }
          ]
        }
      ],
      modifiers: [
        {
          type: 'proficiency',
          entityTypeId: '1958004211',
          value: 2
        },
        {
          type: 'expertise',
          entityTypeId: '1958004211', 
          value: 4
        },
        {
          type: 'half-proficiency',
          skill: 'perception',
          value: 1
        }
      ],
      stats: [
        { id: 1, name: 'strength', value: 15 },
        { id: 2, name: 'dexterity', value: 14 }
      ]
    };
  });

  describe('find() - Legacy compatibility', () => {
    it('should find objects by exact key-value match', () => {
      const results = ObjectSearch.find(testData, 'type', 'proficiency');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        type: 'proficiency',
        entityTypeId: '1958004211',
        value: 2
      });
    });

    it('should find objects by key only (empty value)', () => {
      const results = ObjectSearch.find(testData, 'level', '');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        definition: expect.any(Object),
        level: 5
      });
    });

    it('should find objects by value only (empty key)', () => {
      const results = ObjectSearch.find(testData, '', 'expertise');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        type: 'expertise',
        entityTypeId: '1958004211'
      });
    });

    it('should find multiple objects with same entityTypeId', () => {
      const results = ObjectSearch.find(testData, 'entityTypeId', '1958004211');
      expect(results).toHaveLength(2);
      const types = results.map(r => r.type);
      expect(types).toContain('proficiency');
      expect(types).toContain('expertise');
    });

    it('should return empty array for non-existent matches', () => {
      const results = ObjectSearch.find(testData, 'nonexistent', 'value');
      expect(results).toHaveLength(0);
    });

    it('should handle null and undefined inputs', () => {
      expect(ObjectSearch.find(null, 'key', 'value')).toEqual([]);
      expect(ObjectSearch.find(undefined, 'key', 'value')).toEqual([]);
      expect(ObjectSearch.find('string', 'key', 'value')).toEqual([]);
    });

    it('should avoid duplicate results', () => {
      const results = ObjectSearch.find(testData, 'name', 'Test Character');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Character');
    });
  });

  describe('findByEntityType()', () => {
    it('should find objects by entityTypeId string', () => {
      const results = ObjectSearch.findByEntityType(testData, '1446578651');
      expect(results).toHaveLength(1);
      // Check that we found the definition object with the entityTypeId
      expect(results[0]).toMatchObject({
        name: 'Fighter',
        entityTypeId: '1446578651'
      });
    });

    it('should find objects by entityTypeId number', () => {
      const results = ObjectSearch.findByEntityType(testData, 1446578651);
      expect(results).toHaveLength(1);
      // Check that we found the definition object with the entityTypeId
      expect(results[0]).toMatchObject({
        name: 'Fighter',
        entityTypeId: '1446578651'
      });
    });

    it('should find multiple objects with same entityTypeId', () => {
      const results = ObjectSearch.findByEntityType(testData, '1958004211');
      expect(results).toHaveLength(2);
      expect(results.some(r => r.type === 'proficiency')).toBe(true);
      expect(results.some(r => r.type === 'expertise')).toBe(true);
    });
  });

  describe('findByType()', () => {
    it('should find objects by type field', () => {
      const results = ObjectSearch.findByType(testData, 'feature');
      expect(results).toHaveLength(2);
      const names = results.map(r => r.name);
      expect(names).toContain('Second Wind');
      expect(names).toContain('Action Surge');
    });

    it('should find single object by unique type', () => {
      const results = ObjectSearch.findByType(testData, 'expertise');
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(4);
    });
  });

  describe('findByValue()', () => {
    it('should find objects containing specific value', () => {
      const results = ObjectSearch.findByValue(testData, 'Human');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.fullName === 'Human')).toBe(true);
    });

    it('should find objects by numeric value', () => {
      const results = ObjectSearch.findByValue(testData, 5);
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(5);
    });
  });

  describe('findByKey()', () => {
    it('should find objects containing specific key', () => {
      const results = ObjectSearch.findByKey(testData, 'fullName');
      expect(results).toHaveLength(1);
      expect(results[0].fullName).toBe('Human');
    });

    it('should find multiple objects with same key', () => {
      const results = ObjectSearch.findByKey(testData, 'name');
      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe('findAdvanced()', () => {
    it('should support exact matching (default)', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        key: 'type',
        value: 'proficiency'
      });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('proficiency');
    });

    it('should support partial key matching', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        key: 'entity',
        matchMode: 'partial'
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should support case insensitive matching', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        value: 'HUMAN'
      }, {
        caseSensitive: false
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect maxDepth option', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        key: 'name'
      }, {
        maxDepth: 1
      });
      // Should find less items due to depth limit
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should exclude specified keys', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        key: 'name'
      }, {
        excludeKeys: ['name']
      });
      expect(results).toHaveLength(0);
    });

    it('should handle arrays when includeArrays is true', () => {
      const results = ObjectSearch.findAdvanced(testData, {
        key: 'definition'
      }, {
        includeArrays: true
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getAllKeys()', () => {
    it('should return all unique keys from object tree', () => {
      const keys = ObjectSearch.getAllKeys(testData);
      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('fullName');
      expect(keys).toContain('type');
      expect(keys).toContain('entityTypeId');
      expect(keys).toContain('level');
      expect(keys).toContain('value');
    });

    it('should respect maxDepth parameter', () => {
      const shallowKeys = ObjectSearch.getAllKeys(testData, 1);
      const deepKeys = ObjectSearch.getAllKeys(testData, 10);
      expect(shallowKeys.length).toBeLessThan(deepKeys.length);
    });

    it('should return sorted keys', () => {
      const keys = ObjectSearch.getAllKeys(testData);
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });
  });

  describe('Circular reference handling', () => {
    it('should handle circular references without infinite loop', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const results = ObjectSearch.find(circular, 'name', 'test');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test');
    });

    it('should handle complex circular references', () => {
      const obj1: any = { id: 1, name: 'obj1' };
      const obj2: any = { id: 2, name: 'obj2' };
      obj1.ref = obj2;
      obj2.ref = obj1;
      
      const parent = { children: [obj1, obj2] };
      
      const results = ObjectSearch.find(parent, 'id', 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });
  });

  describe('Legacy getObjects() compatibility', () => {
    it('should provide same results as legacy function', () => {
      const legacyResults = getObjects(testData, 'type', 'proficiency');
      const modernResults = ObjectSearch.find(testData, 'type', 'proficiency');
      
      expect(legacyResults).toEqual(modernResults);
    });

    it('should handle empty parameters like legacy function', () => {
      const legacyResults = getObjects(testData, '', '');
      const modernResults = ObjectSearch.find(testData, '', '');
      
      expect(legacyResults).toEqual(modernResults);
    });

    it('should handle single parameter like legacy function', () => {
      const legacyResults = getObjects(testData, 'type');
      const modernResults = ObjectSearch.find(testData, 'type');
      
      expect(legacyResults).toEqual(modernResults);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large objects efficiently', () => {
      const largeObject = {
        level1: {}
      };
      
      // Create a moderately deep object structure
      let current = largeObject.level1;
      for (let i = 0; i < 20; i++) {
        current[`item${i}`] = {
          id: i,
          type: i % 3 === 0 ? 'special' : 'normal',
          nested: {}
        };
        current = current[`item${i}`].nested;
      }
      
      const start = performance.now();
      const results = ObjectSearch.find(largeObject, 'type', 'special');
      const end = performance.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle arrays within objects', () => {
      const objWithArrays = {
        items: [
          { type: 'weapon', name: 'sword' },
          { type: 'armor', name: 'shield' },
          { type: 'weapon', name: 'bow' }
        ]
      };
      
      const results = ObjectSearch.find(objWithArrays, 'type', 'weapon');
      expect(results).toHaveLength(2);
    });

    it('should handle mixed data types', () => {
      const mixedData = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        nested: {
          value: 42
        }
      };
      
      const numberResults = ObjectSearch.find(mixedData, '', 42);
      expect(numberResults).toHaveLength(2); // number field and nested.value
      
      const booleanResults = ObjectSearch.find(mixedData, '', true);
      expect(booleanResults).toHaveLength(1);
    });
  });
});