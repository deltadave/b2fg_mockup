import { describe, it, expect, beforeEach } from 'vitest';
import { LanguageProcessor } from '@/domain/character/services/LanguageProcessor';
import type { CharacterData } from '@/domain/character/models/CharacterData';

describe('LanguageProcessor', () => {
  let processor: LanguageProcessor;
  let mockCharacterData: CharacterData;

  beforeEach(() => {
    processor = new LanguageProcessor();
    
    mockCharacterData = {
      id: 123456789,
      name: 'Test Character',
      modifiers: {
        race: [],
        class: [],
        background: [],
        feat: [],
        item: [],
        condition: []
      }
    } as CharacterData;
  });

  describe('processCharacterLanguages', () => {
    it('should process granted languages correctly', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        },
        {
          type: 'language', 
          subType: 'elvish',
          friendlySubtypeName: 'Elvish',
          isGranted: true
        }
      ];
      
      mockCharacterData.modifiers.class = [
        {
          type: 'language',
          subType: 'thieves-cant',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(3);
      expect(result.languages.map(l => l.name)).toEqual(['Common', 'Elvish', "Thieves' Cant"]);
      expect(result.choices).toHaveLength(0);
      expect(result.totalLanguages).toBe(3);
    });

    it('should skip non-granted languages', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        },
        {
          type: 'language',
          subType: 'giant',
          friendlySubtypeName: 'Giant',
          isGranted: false // Not granted
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(1);
      expect(result.languages[0].name).toBe('Common');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].name).toBe('Giant');
    });

    it('should handle language choices correctly', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        }
      ];
      
      mockCharacterData.modifiers.class = [
        {
          type: 'language',
          subType: 'choose-a-language',
          friendlySubtypeName: 'Choose a Language',
          isGranted: true,
          isOptional: false
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(1);
      expect(result.languages[0].name).toBe('Common');
      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].label).toBe('Choose a Language');
      expect(result.choices[0].subType).toBe('choose-a-language');
    });

    it('should avoid duplicate languages', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        }
      ];
      
      mockCharacterData.modifiers.class = [
        {
          type: 'language',
          subType: 'common', // Duplicate
          friendlySubtypeName: 'Common',
          isGranted: true
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(1);
      expect(result.skipped).toHaveLength(1);
      expect(result.totalLanguages).toBe(1);
    });

    it('should handle empty or invalid modifiers', () => {
      mockCharacterData.modifiers = {
        race: [],
        class: [],
        background: [],
        feat: [],
        item: [],
        condition: []
      };

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(0);
      expect(result.choices).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.totalLanguages).toBe(0);
    });

    it('should handle character data without modifiers', () => {
      delete (mockCharacterData as any).modifiers;

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(0);
      expect(result.choices).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.totalLanguages).toBe(0);
    });

    it('should format unknown language names correctly', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'custom-made-up-language',
          isGranted: true
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(1);
      expect(result.languages[0].name).toBe('Custom Made Up Language');
    });

    it('should correctly identify language sources', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        }
      ];
      
      mockCharacterData.modifiers.class = [
        {
          type: 'language',
          subType: 'thieves-cant',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true
        }
      ];

      mockCharacterData.modifiers.background = [
        {
          type: 'language',
          subType: 'elvish',
          friendlySubtypeName: 'Elvish',
          isGranted: true
        }
      ];

      const result = processor.processCharacterLanguages(mockCharacterData);

      expect(result.languages).toHaveLength(3);
      expect(result.languages.find(l => l.name === 'Common')?.source).toBe('race');
      expect(result.languages.find(l => l.name === "Thieves' Cant")?.source).toBe('class');
      expect(result.languages.find(l => l.name === 'Elvish')?.source).toBe('background');
    });
  });

  describe('generateLanguagesXML', () => {
    it('should generate correct Fantasy Grounds XML', () => {
      const languages = [
        { id: 'lang-1', name: 'Common', subType: 'common', source: 'race', isGranted: true },
        { id: 'lang-2', name: 'Elvish', subType: 'elvish', source: 'race', isGranted: true },
        { id: 'lang-3', name: "Thieves' Cant", subType: 'thieves-cant', source: 'class', isGranted: true }
      ] as any[];

      const xml = processor.generateLanguagesXML(languages);

      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<name type="string">Common</name>');
      expect(xml).toContain('<id-00002>');
      expect(xml).toContain('<name type="string">Elvish</name>');
      expect(xml).toContain('<id-00003>');
      expect(xml).toContain('<name type="string">Thieves&apos; Cant</name>');
    });

    it('should return empty string for empty languages array', () => {
      const xml = processor.generateLanguagesXML([]);
      expect(xml).toBe('');
    });

    it('should escape XML characters correctly', () => {
      const languages = [
        { id: 'lang-1', name: 'Language with "quotes" & <brackets>', subType: 'custom', source: 'other', isGranted: true }
      ] as any[];

      const xml = processor.generateLanguagesXML(languages);

      expect(xml).toContain('Language with &quot;quotes&quot; &amp; &lt;brackets&gt;');
    });
  });

  describe('generateFoundryVTTLanguages', () => {
    it('should generate correct FoundryVTT language data', () => {
      const languages = [
        { id: 'lang-1', name: 'Common', subType: 'common', source: 'race', isGranted: true },
        { id: 'lang-2', name: 'Elvish', subType: 'elvish', source: 'race', isGranted: true },
        { id: 'lang-3', name: "Thieves' Cant", subType: 'thieves-cant', source: 'class', isGranted: true },
        { id: 'lang-4', name: 'Custom Language', subType: 'custom-language', source: 'other', isGranted: true }
      ] as any[];

      const foundryData = processor.generateFoundryVTTLanguages(languages);

      expect(foundryData.value).toEqual(['common', 'elvish', 'cant']);
      expect(foundryData.custom).toBe('Custom Language');
    });

    it('should handle all custom languages', () => {
      const languages = [
        { id: 'lang-1', name: 'Custom Language 1', subType: 'custom-1', source: 'other', isGranted: true },
        { id: 'lang-2', name: 'Custom Language 2', subType: 'custom-2', source: 'other', isGranted: true }
      ] as any[];

      const foundryData = processor.generateFoundryVTTLanguages(languages);

      expect(foundryData.value).toEqual([]);
      expect(foundryData.custom).toBe('Custom Language 1; Custom Language 2');
    });

    it('should handle empty languages array', () => {
      const foundryData = processor.generateFoundryVTTLanguages([]);

      expect(foundryData.value).toEqual([]);
      expect(foundryData.custom).toBe('');
    });
  });

  describe('validateCharacterData', () => {
    it('should validate correct character data', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          isGranted: true
        }
      ];

      const validation = LanguageProcessor.validateCharacterData(mockCharacterData);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should return error for null character data', () => {
      const validation = LanguageProcessor.validateCharacterData(null as any);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Character data is null or undefined');
    });

    it('should warn when no modifiers found', () => {
      delete (mockCharacterData as any).modifiers;

      const validation = LanguageProcessor.validateCharacterData(mockCharacterData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('No modifiers found - character may have no languages');
    });

    it('should warn when no language modifiers found', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'proficiency',
          subType: 'skill'
        }
      ];

      const validation = LanguageProcessor.validateCharacterData(mockCharacterData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('No language modifiers found - character may not speak any languages');
    });

    it('should warn when Common language is missing', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'elvish',
          isGranted: true
        }
      ];

      const validation = LanguageProcessor.validateCharacterData(mockCharacterData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Character does not have Common language - this is unusual for player characters');
    });

    it('should not warn when Common language is present', () => {
      mockCharacterData.modifiers.race = [
        {
          type: 'language',
          subType: 'common',
          isGranted: true
        }
      ];

      const validation = LanguageProcessor.validateCharacterData(mockCharacterData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('Common language'))).toBe(false);
    });
  });

  describe('language mapping', () => {
    it('should map standard D&D languages correctly', () => {
      const testCases = [
        { subType: 'common', expected: 'Common' },
        { subType: 'dwarvish', expected: 'Dwarvish' },
        { subType: 'elvish', expected: 'Elvish' },
        { subType: 'draconic', expected: 'Draconic' },
        { subType: 'thieves-cant', expected: "Thieves' Cant" },
        { subType: 'deep-speech', expected: 'Deep Speech' }
      ];

      testCases.forEach(({ subType, expected }) => {
        mockCharacterData.modifiers.race = [
          {
            type: 'language',
            subType,
            isGranted: true
          }
        ];

        const result = processor.processCharacterLanguages(mockCharacterData);
        expect(result.languages[0].name).toBe(expected);
      });
    });

    it('should identify choice patterns correctly', () => {
      const choicePatterns = [
        'choose-a-language',
        'choose-a-standard-language',
        'select-a-language',
        'additional-language'
      ];

      choicePatterns.forEach(pattern => {
        mockCharacterData.modifiers.race = [
          {
            type: 'language',
            subType: pattern,
            isGranted: true
          }
        ];

        const result = processor.processCharacterLanguages(mockCharacterData);
        expect(result.choices).toHaveLength(1);
        expect(result.languages).toHaveLength(0);
      });
    });
  });
});