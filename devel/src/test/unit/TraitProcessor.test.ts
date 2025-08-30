import { describe, it, expect, beforeEach } from 'vitest';
import { TraitProcessor } from '../../domain/character/services/TraitProcessor';

describe('TraitProcessor', () => {
  let processor: TraitProcessor;

  beforeEach(() => {
    processor = new TraitProcessor();
  });

  describe('processAllTraits', () => {
    it('should process racial traits correctly and filter hidden traits', () => {
      const mockCharacterData = {
        race: {
          isSubRace: false,
          racialTraits: [
            {
              definition: {
                id: 123,
                name: 'Darkvision', // This should be filtered out
                description: '<p>You can see in dim light within 60 feet of you as if it were bright light.</p>',
                requiredLevel: null
              }
            },
            {
              definition: {
                id: 124,
                name: 'Giant Ancestry', // This should be included
                description: '<p>You are descended from Giants.</p>',
                requiredLevel: null
              }
            },
            {
              definition: {
                id: 125,
                name: 'Ability Score Increase', // This should be filtered out
                description: '<p>Your Strength score increases by 2.</p>',
                requiredLevel: null
              }
            }
          ]
        }
      };

      const traits = processor.processAllTraits(mockCharacterData as any);

      // Should only include Giant Ancestry (Darkvision and Ability Score Increase are filtered)
      expect(traits).toHaveLength(1);
      expect(traits[0].name).toBe('Giant Ancestry');
      expect(traits[0].source).toBe('race');
      expect(traits[0].description).toBe('You are descended from Giants.');
    });

    it('should handle subrace traits overriding race traits', () => {
      const mockCharacterData = {
        race: {
          isSubRace: false,
          racialTraits: [
            {
              definition: {
                id: 123,
                name: 'Fey Step', // Not a hidden trait
                description: '<p>As a bonus action, you can teleport up to 30 feet.</p>',
                requiredLevel: null
              }
            }
          ]
        },
        subrace: {
          isSubRace: true,
          racialTraits: [
            {
              definition: {
                id: 124,
                name: 'Fey Step', // Same name - should override
                description: '<p>Enhanced version: teleport up to 60 feet and deal damage.</p>',
                requiredLevel: null
              }
            },
            {
              definition: {
                id: 125,
                name: 'Misty Step', // Additional subrace trait
                description: '<p>You know the misty step spell.</p>',
                requiredLevel: null
              }
            }
          ]
        }
      };

      // Test with combined race data (simulating how D&D Beyond sends subrace data)
      const combinedCharacterData = {
        race: {
          isSubRace: true, // This would be true for subrace
          racialTraits: [
            ...mockCharacterData.race.racialTraits,
            ...mockCharacterData.subrace.racialTraits
          ]
        }
      };

      const traits = processor.processAllTraits(combinedCharacterData as any);

      expect(traits).toHaveLength(2);
      expect(traits.find(t => t.name === 'Fey Step')?.description).toContain('Enhanced version');
      expect(traits.find(t => t.name === 'Misty Step')).toBeTruthy();
    });

    it('should clean HTML from descriptions', () => {
      const mockCharacterData = {
        race: {
          isSubRace: false,
          racialTraits: [
            {
              definition: {
                id: 123,
                name: 'Complex Trait',
                description: '\u003Cp\u003EYou have \u003Cstrong\u003Eadvantage\u003C/strong\u003E on saving throws.\u003C/p\u003E\r\n\u003Cp\u003EYou can also use \u003Cem\u003Especial abilities\u003C/em\u003E.\u003C/p\u003E',
                requiredLevel: null
              }
            }
          ]
        }
      };

      const traits = processor.processAllTraits(mockCharacterData as any);

      expect(traits[0].description).toBe('You have **advantage** on saving throws.\n\nYou can also use *special abilities*.');
    });
  });

  describe('generateTraitsXML', () => {
    it('should generate properly formatted Fantasy Grounds XML', () => {
      const traits = [
        {
          id: 'test-1',
          name: 'Darkvision',
          description: 'You can see in dim light within 60 feet of you as if it were bright light.',
          source: 'race' as const,
          requiredLevel: null
        },
        {
          id: 'test-2',
          name: 'Giant Ancestry',
          description: 'You are descended from Giants.\n\nThis grants you special abilities.',
          source: 'race' as const,
          requiredLevel: null
        }
      ];

      const xml = processor.generateTraitsXML(traits);

      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<id-00002>');
      expect(xml).toContain('<name type="string">Darkvision</name>');
      expect(xml).toContain('<name type="string">Giant Ancestry</name>');
      expect(xml).toContain('<locked type="number">1</locked>');
      expect(xml).toContain('<text type="formattedtext">');
      expect(xml).toContain('<p>You can see in dim light within 60 feet of you as if it were bright light.</p>');
      expect(xml).toContain('<p>You are descended from Giants.</p>');
      expect(xml).toContain('<p>This grants you special abilities.</p>');
      // Should not contain traitlist tags (those are added by the formatter)
      expect(xml).not.toContain('<traitlist>');
      expect(xml).not.toContain('</traitlist>');
    });

    it('should return empty string for no traits', () => {
      const xml = processor.generateTraitsXML([]);
      expect(xml).toBe('');
    });

    it('should escape XML characters properly', () => {
      const traits = [
        {
          id: 'test-1',
          name: 'Trait & Special',
          description: 'You have <advantage> on "saving throws" & \'special abilities\'.',
          source: 'race' as const,
          requiredLevel: null
        }
      ];

      const xml = processor.generateTraitsXML(traits);

      expect(xml).toContain('Trait &amp; Special');
      expect(xml).toContain('&lt;advantage&gt;');
      expect(xml).toContain('&quot;saving throws&quot;');
      expect(xml).toContain('&apos;special abilities&apos;');
    });
  });
});