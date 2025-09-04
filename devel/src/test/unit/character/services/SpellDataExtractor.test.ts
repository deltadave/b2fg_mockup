/**
 * SpellDataExtractor Unit Tests
 * 
 * Tests spell extraction from D&D Beyond character data JSON
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpellDataExtractor } from '@/domain/character/services/SpellDataExtractor';
import type { NormalizedSpell } from '@/domain/character/models/Spells';

describe('SpellDataExtractor', () => {
  let extractor: SpellDataExtractor;

  beforeEach(() => {
    extractor = new SpellDataExtractor();
  });

  describe('extractSpells', () => {
    it('should extract spells from valid D&D Beyond character data', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Wizard',
          spells: {
            race: [],
            class: [
              {
                id: 1,
                definition: {
                  id: 1,
                  name: 'Magic Missile',
                  level: 1,
                  school: {
                    id: 7,
                    name: 'Evocation'
                  },
                  duration: {
                    durationInterval: 'Instantaneous',
                    durationUnit: null
                  },
                  range: {
                    origin: '120',
                    rangeValue: 120
                  },
                  castingTime: {
                    castingTimeInterval: 1,
                    castingTimeUnit: 'Action'
                  },
                  components: {
                    verbal: true,
                    somatic: true,
                    material: false
                  },
                  description: 'You create three glowing darts of magical force.',
                  damageTypes: [
                    {
                      id: 6,
                      name: 'Force'
                    }
                  ],
                  savingThrowAbilities: [],
                  ritual: false,
                  concentration: false
                },
                prepared: true,
                alwaysPrepared: false,
                usesSpellSlot: true,
                castAtLevel: null
              }
            ],
            item: [],
            feat: []
          }
        }
      };

      const result = await extractor.extractSpells(mockCharacterData);

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(1);
      expect(result.spells[0].name).toBe('Magic Missile');
      expect(result.spells[0].level).toBe(1);
      expect(result.spells[0].school).toBe('evocation');
      expect(result.spells[0].source).toBe('class');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle characters with no spells', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Fighter',
          spells: {
            race: [],
            class: [],
            item: [],
            feat: []
          }
        }
      };

      const result = await extractor.extractSpells(mockCharacterData);

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(0);
      expect(result.warnings).toContain(expect.objectContaining({
        code: 'NO_SPELLS_FOUND'
      }));
    });

    it('should handle malformed character data gracefully', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Character'
          // Missing spells property
        }
      };

      const result = await extractor.extractSpells(mockCharacterData);

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(0);
      expect(result.warnings).toContain(expect.objectContaining({
        code: 'NO_SPELL_DATA'
      }));
    });

    it('should extract spells from all sources (race, class, item, feat)', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Character',
          spells: {
          race: [
            {
              id: 1,
              definition: {
                id: 1,
                name: 'Dancing Lights',
                level: 0,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: true, material: false },
                description: 'You create up to four torch-sized lights.',
                ritual: false,
                concentration: true
              }
            }
          ],
          class: [
            {
              id: 2,
              definition: {
                id: 2,
                name: 'Fireball',
                level: 3,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: true, material: true },
                description: 'A bright streak flashes from your pointing finger.',
                ritual: false,
                concentration: false
              },
              prepared: true
            }
          ],
          item: [
            {
              id: 3,
              definition: {
                id: 3,
                name: 'Cure Light Wounds',
                level: 1,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: true, material: false },
                description: 'A creature you touch regains hit points.',
                ritual: false,
                concentration: false
              }
            }
          ],
          feat: [
            {
              id: 4,
              definition: {
                id: 4,
                name: 'Eldritch Blast',
                level: 0,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: true, material: false },
                description: 'A beam of crackling energy streaks toward a creature.',
                ritual: false,
                concentration: false
              }
            }
          ]
          }
        }
      };

      const result = await extractor.extractSpells(mockCharacterData);

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(4);
      
      const sources = result.spells.map(spell => spell.source);
      expect(sources).toContain('race');
      expect(sources).toContain('class');
      expect(sources).toContain('item');
      expect(sources).toContain('feat');
    });

    it('should validate spells when validation is enabled', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Character',
          spells: {
          race: [],
          class: [
            {
              id: 1,
              definition: {
                id: 1,
                name: 'Invalid Spell',
                level: -1, // Invalid level
                school: { id: 999, name: 'Unknown School' }, // Invalid school
                components: { verbal: true, somatic: true, material: false },
                description: 'An invalid spell for testing.',
                ritual: false,
                concentration: false
              }
            }
          ],
          item: [],
          feat: []
          }
        }
      };

      const result = await extractor.extractSpells(mockCharacterData, {
        validateSpells: true,
        strictValidation: true
      });

      expect(result.validationResults).toHaveLength(1);
      expect(result.validationResults[0].isValid).toBe(false);
      expect(result.validationResults[0].errors).toContain(expect.objectContaining({
        code: 'INVALID_SPELL_LEVEL'
      }));
    });

    it('should deduplicate spells when deduplication is enabled', async () => {
      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Character',
          spells: {
          race: [
            {
              id: 1,
              definition: {
                id: 1,
                name: 'Light',
                level: 0,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: false, material: true },
                description: 'You touch one object.',
                ritual: false,
                concentration: false
              }
            }
          ],
          class: [
            {
              id: 2, // Different id but same spell
              definition: {
                id: 1, // Same definition id
                name: 'Light',
                level: 0,
                school: { id: 7, name: 'Evocation' },
                components: { verbal: true, somatic: false, material: true },
                description: 'You touch one object.',
                ritual: false,
                concentration: false
              },
              prepared: true
            }
          ],
          item: [],
          feat: []
          }
        }
      };

      const result = await extractor.extractSpells(mockCharacterData, {
        deduplicateSpells: true
      });

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
      expect(result.spells[0].source).toBe('class'); // Should prefer class spells
    });
  });


  describe('performance', () => {
    it('should process large spell lists efficiently', async () => {
      // Create a large spell list
      const spells = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        definition: {
          id: i + 1,
          name: `Spell ${i + 1}`,
          level: (i % 9) + 1,
          school: { id: 7, name: 'Evocation' },
          components: { verbal: true, somatic: true, material: false },
          description: `Description for spell ${i + 1}`,
          ritual: false,
          concentration: false
        }
      }));

      const mockCharacterData = {
        data: {
          id: 12345678,
          name: 'Test Wizard',
          spells: {
            race: [],
            class: spells,
            item: [],
            feat: []
          }
        }
      };

      const startTime = performance.now();
      const result = await extractor.extractSpells(mockCharacterData);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.spells).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(result.performance.totalTime).toBeGreaterThan(0);
    });
  });
});