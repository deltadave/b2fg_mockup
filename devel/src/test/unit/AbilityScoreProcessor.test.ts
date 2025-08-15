import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AbilityScoreProcessor, type BonusProcessingResult } from '@/domain/character/services/AbilityScoreProcessor';
import { ABILITY_NAMES } from '@/domain/character/constants/AbilityConstants';

describe('AbilityScoreProcessor', () => {
  describe('processAbilityScoreBonuses()', () => {
    it('should initialize bonusStats for character without existing bonusStats', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 },
          { id: 3, value: 13 },
          { id: 4, value: 12 },
          { id: 5, value: 10 },
          { id: 6, value: 8 }
        ]
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses).toHaveLength(6);
      result.processedBonuses.forEach((bonus, index) => {
        expect(bonus.id).toBe(index + 1);
        expect(bonus.value).toBe(0);
      });
    });

    it('should start with fresh bonusStats to avoid double-counting', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: [
          { id: 1, value: null },
          { id: 2, value: undefined },
          { id: 3, value: 2 } // This existing bonus should be ignored to prevent double-counting
        ]
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      // All bonusStats should start at 0 to prevent double-counting
      expect(result.processedBonuses[0].value).toBe(0); // fresh start
      expect(result.processedBonuses[1].value).toBe(0); // fresh start
      expect(result.processedBonuses[2].value).toBe(0); // ignored existing bonus
    });

    it('should process racial ability bonuses', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            {
              type: 'bonus',
              subType: 'strength-score',
              fixedValue: 2
            },
            {
              type: 'bonus',
              subType: 'constitution-score',
              fixedValue: 1
            }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(2); // Strength +2
      expect(result.processedBonuses[2].value).toBe(1); // Constitution +1
      expect(result.debugInfo.appliedBonuses).toEqual([
        { source: 'race', ability: 'strength', bonus: 2 },
        { source: 'race', ability: 'constitution', bonus: 1 }
      ]);
    });

    it('should process feat ability bonuses', () => {
      const character = {
        stats: [{ id: 4, value: 12 }],
        modifiers: {
          feat: [
            {
              type: 'bonus',
              subType: 'intelligence-score',
              fixedValue: 1
            }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[3].value).toBe(1); // Intelligence +1
      expect(result.debugInfo.appliedBonuses).toContainEqual({
        source: 'feat',
        ability: 'intelligence',
        bonus: 1
      });
    });

    it('should process item ability bonuses', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          item: [
            {
              type: 'bonus',
              subType: 'strength-score',
              fixedValue: 2
            }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(2); // Strength +2 from item
      expect(result.debugInfo.appliedBonuses).toContainEqual({
        source: 'item',
        ability: 'strength',
        bonus: 2
      });
    });

    it('should handle multiple bonuses from different sources', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 }
          ],
          feat: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 1 }
          ],
          item: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(5); // 2 + 1 + 2 = 5
      expect(result.debugInfo.appliedBonuses).toHaveLength(3);
    });

    it('should ignore non-score bonuses', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 },
            { type: 'bonus', subType: 'armor-class', fixedValue: 1 },
            { type: 'bonus', subType: 'hit-points', fixedValue: 5 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(2); // Only strength-score applied
      expect(result.debugInfo.appliedBonuses).toHaveLength(1);
    });

    it('should ignore zero or negative bonuses', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 0 },
            { type: 'bonus', subType: 'dexterity-score', fixedValue: -1 },
            { type: 'bonus', subType: 'constitution-score', fixedValue: 2 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(0); // Zero ignored
      expect(result.processedBonuses[1].value).toBe(0); // Negative ignored
      expect(result.processedBonuses[2].value).toBe(2); // Positive applied
      expect(result.debugInfo.appliedBonuses).toHaveLength(1);
    });

    it('should calculate total scores correctly', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 },
          { id: 3, value: 13 },
          { id: 4, value: 12 },
          { id: 5, value: 10 },
          { id: 6, value: 8 }
        ],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 },
            { type: 'bonus', subType: 'constitution-score', fixedValue: 1 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.totalScores.strength).toEqual({
        base: 15,
        bonus: 2,
        override: null,
        total: 17,
        modifier: 3
      });

      expect(result.totalScores.constitution).toEqual({
        base: 13,
        bonus: 1,
        override: null,
        total: 14,
        modifier: 2
      });

      expect(result.totalScores.dexterity).toEqual({
        base: 14,
        bonus: 0,
        override: null,
        total: 14,
        modifier: 2
      });
    });

    it('should handle override stats correctly', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: [{ id: 1, value: 2 }], // This will be ignored to prevent double-counting
        overrideStats: [{ id: 1, value: 20 }]
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.totalScores.strength).toEqual({
        base: 15,
        bonus: 0, // Fresh calculation, no modifiers found
        override: 20,
        total: 20, // Override takes precedence
        modifier: 5
      });
    });

    it('should generate correct final bonus summary', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 }
        ],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 },
            { type: 'bonus', subType: 'dexterity-score', fixedValue: 1 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.debugInfo.finalBonusSummary).toEqual([
        { ability: 'strength', bonus: 2 },
        { ability: 'dexterity', bonus: 1 }
      ]);
    });
  });

  describe('getTotalAbilityScore()', () => {
    it('should return base score when no bonuses exist', () => {
      const character = {
        stats: [{ id: 1, value: 15 }]
      };

      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 1);

      expect(total).toBe(15);
    });

    it('should return base + bonus when bonuses exist', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: [{ id: 1, value: 2 }]
      };

      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 1);

      expect(total).toBe(17);
    });

    it('should return override when it exists', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: [{ id: 1, value: 2 }],
        overrideStats: [{ id: 1, value: 20 }]
      };

      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 1);

      expect(total).toBe(20); // Override takes precedence
    });

    it('should use default score when stats are missing', () => {
      const character = {};

      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 1);

      expect(total).toBe(10); // Default score
    });

    it('should handle out-of-bounds scoreId gracefully', () => {
      const character = {
        stats: [{ id: 1, value: 15 }]
      };

      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 7);

      expect(total).toBe(10); // Default when out of bounds
    });

    it('should use provided bonusStats parameter', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: [{ id: 1, value: 1 }] // This should be ignored
      };

      const customBonusStats = [{ id: 1, value: 3 }];
      const total = AbilityScoreProcessor.getTotalAbilityScore(character, 1, customBonusStats);

      expect(total).toBe(18); // 15 + 3, not 15 + 1
    });
  });

  describe('processLegacyFormat()', () => {
    it('should return data in legacy format', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 },
          { id: 3, value: 13 },
          { id: 4, value: 12 },
          { id: 5, value: 10 },
          { id: 6, value: 8 }
        ],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 }
          ],
          feat: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 1 }
          ],
          item: [
            { type: 'bonus', subType: 'dexterity-score', fixedValue: 2 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processLegacyFormat(character);

      expect(result).toHaveLength(6);
      
      const strengthResult = result[0];
      expect(strengthResult).toEqual({
        id: 1,
        name: 'strength',
        base: 15,
        racial: 2,
        feat: 1,
        item: 0,
        total: 18,
        modifier: 4
      });

      const dexterityResult = result[1];
      expect(dexterityResult).toEqual({
        id: 2,
        name: 'dexterity',
        base: 14,
        racial: 0,
        feat: 0,
        item: 2,
        total: 16,
        modifier: 3
      });
    });

    it('should handle missing modifier sources', () => {
      const character = {
        stats: [{ id: 1, value: 15 }]
      };

      const result = AbilityScoreProcessor.processLegacyFormat(character);

      expect(result[0]).toEqual({
        id: 1,
        name: 'strength',
        base: 15,
        racial: 0,
        feat: 0,
        item: 0,
        total: 15,
        modifier: 2
      });
    });
  });

  describe('validateCharacterData()', () => {
    it('should return valid for properly structured character', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 },
          { id: 3, value: 13 },
          { id: 4, value: 12 },
          { id: 5, value: 10 },
          { id: 6, value: 8 }
        ],
        bonusStats: [
          { id: 1, value: 0 }
        ],
        modifiers: {
          race: []
        }
      };

      const validation = AbilityScoreProcessor.validateCharacterData(character);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should return invalid for null character', () => {
      const validation = AbilityScoreProcessor.validateCharacterData(null);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Character data is null or undefined');
    });

    it('should warn about missing stats array', () => {
      const character = {};

      const validation = AbilityScoreProcessor.validateCharacterData(character);

      expect(validation.isValid).toBe(true); // Still valid, just warnings
      expect(validation.warnings).toContain('Character stats array is missing or invalid - will use defaults');
    });

    it('should warn about incomplete stats array', () => {
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 }
        ]
      };

      const validation = AbilityScoreProcessor.validateCharacterData(character);

      expect(validation.warnings).toContain('Character stats array has 2 entries, expected 6');
    });

    it('should warn about invalid bonusStats', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        bonusStats: "not an array"
      };

      const validation = AbilityScoreProcessor.validateCharacterData(character);

      expect(validation.warnings).toContain('Character bonusStats is not an array - will initialize');
    });

    it('should warn about invalid modifier structure', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: "not an array"
        }
      };

      const validation = AbilityScoreProcessor.validateCharacterData(character);

      expect(validation.warnings).toContain('Character modifiers.race is not an array');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle character with empty modifiers object', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {}
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(0);
      expect(result.debugInfo.appliedBonuses).toHaveLength(0);
    });

    it('should handle modifiers with invalid ability names', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'invalid-ability-score', fixedValue: 2 },
            { type: 'bonus', subType: 'strength-score', fixedValue: 1 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(1); // Only valid one applied
      expect(result.debugInfo.appliedBonuses).toHaveLength(1);
    });

    it('should handle modifiers with null fixedValue', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: null },
            { type: 'bonus', subType: 'dexterity-score', fixedValue: undefined },
            { type: 'bonus', subType: 'constitution-score', fixedValue: 2 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(0); // null ignored
      expect(result.processedBonuses[1].value).toBe(0); // undefined ignored
      expect(result.processedBonuses[2].value).toBe(2); // valid applied
      expect(result.debugInfo.appliedBonuses).toHaveLength(1);
    });

    it('should handle string numbers in fixedValue', () => {
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: "2" },
            { type: 'bonus', subType: 'dexterity-score', fixedValue: "invalid" }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.processedBonuses[0].value).toBe(2); // String converted to number
      expect(result.processedBonuses[1].value).toBe(0); // Invalid string -> 0, ignored
      expect(result.debugInfo.appliedBonuses).toHaveLength(1);
    });
  });

  describe('Real Character Data Testing', () => {
    it('should correctly process realistic character data with debug', () => {
      // Enable debug for this test
      AbilityScoreProcessor.setDebugMode(true);
      
      const realisticCharacter = {
        stats: [
          { id: 1, value: 15 }, // Strength
          { id: 2, value: 14 }, // Dexterity  
          { id: 3, value: 13 }, // Constitution
          { id: 4, value: 12 }, // Intelligence
          { id: 5, value: 10 }, // Wisdom
          { id: 6, value: 8 }   // Charisma
        ],
        bonusStats: [
          { id: 1, value: 3 }, // Pre-calculated by D&D Beyond (should be ignored)
          { id: 2, value: 0 },
          { id: 3, value: 1 },
          { id: 4, value: 0 },
          { id: 5, value: 0 },
          { id: 6, value: 0 }
        ],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2, friendlyTypeName: 'Goliath Strength' },
            { type: 'bonus', subType: 'constitution-score', fixedValue: 1, friendlyTypeName: 'Goliath Constitution' }
          ],
          feat: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 1, friendlyTypeName: 'Ability Score Improvement' }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(realisticCharacter);

      // Should calculate bonuses correctly from modifiers, not use D&D Beyond's pre-calculated ones
      expect(result.processedBonuses[0].value).toBe(3); // 2 (race) + 1 (feat) = 3
      expect(result.processedBonuses[2].value).toBe(1); // 1 (race) = 1
      
      // Total scores should reflect calculated bonuses
      expect(result.totalScores.strength).toEqual({
        base: 15,
        bonus: 3, // Our calculated bonus
        override: null,
        total: 18, // 15 + 3 = 18
        modifier: 4
      });

      expect(result.totalScores.constitution).toEqual({
        base: 13,
        bonus: 1, // Our calculated bonus
        override: null,
        total: 14, // 13 + 1 = 14
        modifier: 2
      });

      // Debug info should show applied bonuses
      expect(result.debugInfo.appliedBonuses).toHaveLength(3);
      expect(result.debugInfo.appliedBonuses).toContainEqual({
        source: 'race',
        ability: 'strength',
        bonus: 2
      });
      
      AbilityScoreProcessor.setDebugMode(false);
    });
  });

  describe('Integration with D&D Beyond patterns', () => {
    it('should work with typical D&D Beyond Goliath character', () => {
      const goliathCharacter = {
        stats: [
          { id: 1, value: 15 }, // Strength
          { id: 2, value: 13 }, // Dexterity
          { id: 3, value: 14 }, // Constitution
          { id: 4, value: 10 }, // Intelligence
          { id: 5, value: 12 }, // Wisdom
          { id: 6, value: 8 }   // Charisma
        ],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 },
            { type: 'bonus', subType: 'constitution-score', fixedValue: 1 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(goliathCharacter);

      expect(result.totalScores.strength.total).toBe(17); // 15 + 2
      expect(result.totalScores.constitution.total).toBe(15); // 14 + 1
      expect(result.totalScores.dexterity.total).toBe(13); // 13 + 0
    });

    it('should work with Ability Score Improvement feat', () => {
      const character = {
        stats: [{ id: 1, value: 15 }, { id: 2, value: 14 }],
        modifiers: {
          feat: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 1 },
            { type: 'bonus', subType: 'dexterity-score', fixedValue: 1 }
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.totalScores.strength.total).toBe(16); // 15 + 1
      expect(result.totalScores.dexterity.total).toBe(15); // 14 + 1
    });

    it('should work with magic item bonuses', () => {
      const character = {
        stats: [{ id: 1, value: 18 }],
        modifiers: {
          item: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2 } // Belt of Giant Strength
          ]
        }
      };

      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);

      expect(result.totalScores.strength.total).toBe(20); // 18 + 2
    });
  });

  describe('Debug Functionality', () => {
    it('should enable and disable debug mode', () => {
      // Test debug mode toggle
      AbilityScoreProcessor.setDebugMode(true);
      
      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: [
            { type: 'bonus', subType: 'strength-score', fixedValue: 2, friendlyTypeName: 'Goliath Racial Bonus' }
          ]
        }
      };

      // Should run debug output when enabled
      const consoleSpy = vi.spyOn(console, 'group');
      AbilityScoreProcessor.processAbilityScoreBonuses(character);
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Detailed Ability Score Modifier Analysis');
      
      // Disable debug mode
      AbilityScoreProcessor.setDebugMode(false);
      consoleSpy.mockClear();
      
      // Should not run debug output when disabled
      AbilityScoreProcessor.processAbilityScoreBonuses(character);
      expect(consoleSpy).not.toHaveBeenCalledWith('🔍 Detailed Ability Score Modifier Analysis');
      
      consoleSpy.mockRestore();
    });

    it('should provide detailed modifier source analysis', () => {
      AbilityScoreProcessor.setDebugMode(true);
      
      const character = {
        stats: [
          { id: 1, value: 15 },
          { id: 2, value: 14 }
        ],
        modifiers: {
          race: [
            { 
              type: 'bonus', 
              subType: 'strength-score', 
              fixedValue: 2,
              friendlyTypeName: 'Goliath Racial Bonus',
              componentId: 123,
              entityId: 456
            }
          ],
          feat: [
            { 
              type: 'bonus', 
              subType: 'dexterity-score', 
              fixedValue: 1,
              friendlyTypeName: 'Ability Score Improvement'
            }
          ]
        }
      };

      const consoleLogSpy = vi.spyOn(console, 'log');
      AbilityScoreProcessor.debugAbilityModifierSources(character);
      
      // Should log base stats
      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Base Ability Scores:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  strength: 15 (base)');
      
      // Should log modifier sources
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🎯 RACE Modifiers:');
      expect(consoleLogSpy).toHaveBeenCalledWith('    ✅ strength-score: +2 (Goliath Racial Bonus)');
      
      consoleLogSpy.mockRestore();
      AbilityScoreProcessor.setDebugMode(false);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large modifier arrays efficiently', () => {
      const manyModifiers = [];
      for (let i = 0; i < 100; i++) {
        manyModifiers.push({
          type: 'bonus',
          subType: 'strength-score',
          fixedValue: 1
        });
      }

      const character = {
        stats: [{ id: 1, value: 15 }],
        modifiers: {
          race: manyModifiers
        }
      };

      const start = performance.now();
      const result = AbilityScoreProcessor.processAbilityScoreBonuses(character);
      const end = performance.now();

      expect(result.processedBonuses[0].value).toBe(100); // All bonuses applied
      expect(end - start).toBeLessThan(100); // Should complete quickly
    });
  });
});