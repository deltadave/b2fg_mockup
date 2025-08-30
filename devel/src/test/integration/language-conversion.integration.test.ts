import { describe, it, expect, beforeEach } from 'vitest';
import { ConversionOrchestrator } from '@/domain/conversion/ConversionOrchestrator';
import { FantasyGroundsXMLFormatter } from '@/domain/export/formatters/FantasyGroundsXMLFormatter';
import { FoundryVTTJSONFormatter } from '@/domain/export/formatters/FoundryVTTJSONFormatter';
import type { CharacterData } from '@/domain/character/models/CharacterData';
import type { ProcessedCharacterData } from '@/domain/export/interfaces/OutputFormatter';

describe('Language Conversion Integration', () => {
  let orchestrator: ConversionOrchestrator;
  let fantasyGroundsFormatter: FantasyGroundsXMLFormatter;
  let foundryFormatter: FoundryVTTJSONFormatter;

  beforeEach(() => {
    orchestrator = new ConversionOrchestrator();
    fantasyGroundsFormatter = new FantasyGroundsXMLFormatter();
    foundryFormatter = new FoundryVTTJSONFormatter();
  });

  const createTestCharacterData = (languages: any[]): CharacterData => ({
    id: 151483095,
    name: 'TestCharacter2',
    race: {
      fullName: 'High Elf'
    },
    classes: [
      {
        id: 12,
        level: 5,
        definition: {
          id: 12,
          name: 'Rogue',
          canCastSpells: false
        }
      }
    ],
    stats: [
      { id: 1, value: 8, name: 'strength' },
      { id: 2, value: 18, name: 'dexterity' },
      { id: 3, value: 14, name: 'constitution' },
      { id: 4, value: 13, name: 'intelligence' },
      { id: 5, value: 12, name: 'wisdom' },
      { id: 6, value: 10, name: 'charisma' }
    ],
    modifiers: languages,
    choices: [],
    inventory: [],
    spells: {
      class: [],
      race: [],
      item: [],
      feat: [],
      background: []
    },
    background: {
      definition: {
        name: 'Criminal'
      }
    }
  } as CharacterData);

  describe('Complete Language Processing Pipeline', () => {
    it('should process languages through the entire orchestrator pipeline', async () => {
      const testLanguages = [
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
          isGranted: true
        },
        {
          type: 'language',
          subType: 'thieves-cant',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true
        }
      ];

      const characterData = createTestCharacterData(testLanguages);
      const result = await orchestrator.processCharacter(characterData);

      expect(result.success).toBe(true);
      expect(result.processedCharacter).toBeDefined();
      expect(result.processedCharacter!.languages).toBeDefined();
      expect(result.processedCharacter!.languages.languages).toHaveLength(3);
      expect(result.processedCharacter!.languages.totalLanguages).toBe(3);

      // Verify languages are processed correctly
      const languageNames = result.processedCharacter!.languages.languages.map(l => l.name);
      expect(languageNames).toContain('Common');
      expect(languageNames).toContain('Giant');
      expect(languageNames).toContain("Thieves' Cant");
    });

    it('should handle language choices correctly', async () => {
      const testLanguages = [
        {
          type: 'language',
          subType: 'common',
          friendlySubtypeName: 'Common',
          isGranted: true
        },
        {
          type: 'language',
          subType: 'choose-a-language',
          friendlySubtypeName: 'Choose a Language',
          isGranted: true
        }
      ];

      const characterData = createTestCharacterData(testLanguages);
      const result = await orchestrator.processCharacter(characterData);

      expect(result.success).toBe(true);
      expect(result.processedCharacter!.languages.languages).toHaveLength(1);
      expect(result.processedCharacter!.languages.languages[0].name).toBe('Common');
      expect(result.processedCharacter!.languages.choices).toHaveLength(1);
      expect(result.processedCharacter!.languages.choices[0].label).toBe('Choose a Language');
      expect(result.warnings.some(w => w.message.includes('language choices'))).toBe(true);
    });

    it('should skip non-granted languages', async () => {
      const testLanguages = [
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

      const characterData = createTestCharacterData(testLanguages);
      const result = await orchestrator.processCharacter(characterData);

      expect(result.success).toBe(true);
      expect(result.processedCharacter!.languages.languages).toHaveLength(1);
      expect(result.processedCharacter!.languages.languages[0].name).toBe('Common');
      expect(result.processedCharacter!.languages.skipped).toHaveLength(1);
    });
  });

  describe('Fantasy Grounds XML Generation', () => {
    it('should generate correct Fantasy Grounds XML with languages', async () => {
      const testLanguages = [
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
          isGranted: true
        },
        {
          type: 'language',
          subType: 'thieves-cant',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true
        }
      ];

      const characterData = createTestCharacterData(testLanguages);
      const orchestratorResult = await orchestrator.processCharacter(characterData);

      expect(orchestratorResult.success).toBe(true);

      // Convert orchestrator result to the format expected by formatters
      const processedData: ProcessedCharacterData = {
        characterData,
        name: characterData.name,
        level: 5,
        totalLevel: 5,
        abilities: {},
        inventory: { items: [], totalWeight: 0 },
        spells: {},
        features: {},
        encumbrance: {}
      };

      const formatResult = await fantasyGroundsFormatter.generateOutput(processedData);

      expect(formatResult.success).toBe(true);
      expect(formatResult.output).toBeDefined();
      
      // Verify XML contains language list
      expect(formatResult.output!).toContain('<languagelist>');
      expect(formatResult.output!).toContain('<id-00001>');
      expect(formatResult.output!).toContain('<name type="string">Common</name>');
      expect(formatResult.output!).toContain('<name type="string">Giant</name>');
      expect(formatResult.output!).toContain('<name type="string">Thieves&apos; Cant</name>');
    });

    it('should handle empty language list gracefully', async () => {
      const characterData = createTestCharacterData([]);
      const orchestratorResult = await orchestrator.processCharacter(characterData);

      expect(orchestratorResult.success).toBe(true);

      const processedData: ProcessedCharacterData = {
        characterData,
        name: characterData.name,
        level: 5,
        totalLevel: 5,
        abilities: {},
        inventory: { items: [], totalWeight: 0 },
        spells: {},
        features: {},
        encumbrance: {}
      };

      const formatResult = await fantasyGroundsFormatter.generateOutput(processedData);

      expect(formatResult.success).toBe(true);
      expect(formatResult.output!).toContain('<languagelist>');
      expect(formatResult.output!).toContain('<!-- No languages found -->');
    });
  });

  describe('FoundryVTT JSON Generation', () => {
    it('should generate correct FoundryVTT JSON with languages', async () => {
      const testLanguages = [
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
        },
        {
          type: 'language',
          subType: 'thieves-cant',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true
        },
        {
          type: 'language',
          subType: 'custom-language',
          friendlySubtypeName: 'Custom Language',
          isGranted: true
        }
      ];

      const characterData = createTestCharacterData(testLanguages);
      
      const processedData: ProcessedCharacterData = {
        characterData,
        name: characterData.name,
        level: 5,
        totalLevel: 5,
        abilities: {},
        inventory: { items: [], totalWeight: 0 },
        spells: {},
        features: {},
        encumbrance: {}
      };

      const formatResult = await foundryFormatter.generateOutput(processedData);

      expect(formatResult.success).toBe(true);
      expect(formatResult.output).toBeDefined();

      const foundryActor = JSON.parse(formatResult.output!);
      
      expect(foundryActor.system.traits.languages.value).toContain('common');
      expect(foundryActor.system.traits.languages.value).toContain('elvish');
      expect(foundryActor.system.traits.languages.value).toContain('cant');
      expect(foundryActor.system.traits.languages.custom).toContain('Custom Language');
    });

    it('should handle empty language list in FoundryVTT format', async () => {
      const characterData = createTestCharacterData([]);
      
      const processedData: ProcessedCharacterData = {
        characterData,
        name: characterData.name,
        level: 5,
        totalLevel: 5,
        abilities: {},
        inventory: { items: [], totalWeight: 0 },
        spells: {},
        features: {},
        encumbrance: {}
      };

      const formatResult = await foundryFormatter.generateOutput(processedData);

      expect(formatResult.success).toBe(true);

      const foundryActor = JSON.parse(formatResult.output!);
      
      expect(foundryActor.system.traits.languages.value).toEqual([]);
      expect(foundryActor.system.traits.languages.custom).toBe('');
    });
  });

  describe('Real Test Data Integration', () => {
    it('should process TestCharacter2 language data correctly', async () => {
      // This test mirrors the actual data structure from TestCharacter2_151483095_v05.json
      const testLanguages = [
        {
          entityId: 1,
          entityTypeId: 906033267,
          type: 'language',
          subType: 'common',
          dice: null,
          restriction: '',
          value: 1,
          requiresAttunement: false,
          duration: null,
          friendlyTypeName: 'Language',
          friendlySubtypeName: 'Common',
          isGranted: true,
          bonusTypes: [],
          value2: null,
          componentTypeId: 1472902489,
          componentId: 152
        },
        {
          entityId: 4,
          entityTypeId: 906033267,
          type: 'language',
          subType: 'giant',
          dice: null,
          restriction: '',
          value: 1,
          requiresAttunement: false,
          duration: null,
          friendlyTypeName: 'Language',
          friendlySubtypeName: 'Giant',
          isGranted: false, // Available but not selected
          bonusTypes: [],
          value2: null,
          componentTypeId: 1472902489,
          componentId: 152
        },
        {
          entityId: 46,
          entityTypeId: 906033267,
          type: 'language',
          subType: 'thieves-cant',
          dice: null,
          restriction: '',
          value: 1,
          requiresAttunement: false,
          duration: null,
          friendlyTypeName: 'Language',
          friendlySubtypeName: "Thieves' Cant",
          isGranted: true,
          bonusTypes: [],
          value2: null,
          componentTypeId: 304218077,
          componentId: 6307
        },
        {
          entityId: null,
          entityTypeId: null,
          type: 'language',
          subType: 'choose-a-language',
          dice: null,
          restriction: '',
          value: 1,
          requiresAttunement: false,
          duration: null,
          friendlyTypeName: 'Language',
          friendlySubtypeName: 'Choose a Language',
          isGranted: true,
          bonusTypes: [],
          value2: null,
          componentTypeId: 304218077,
          componentId: 6307
        }
      ];

      const characterData = createTestCharacterData(testLanguages);
      const result = await orchestrator.processCharacter(characterData);

      expect(result.success).toBe(true);
      
      // Should have 2 granted languages (Common, Thieves' Cant)
      expect(result.processedCharacter!.languages.languages).toHaveLength(2);
      expect(result.processedCharacter!.languages.languages.map(l => l.name)).toEqual(['Common', "Thieves' Cant"]);
      
      // Should have 1 choice (Choose a Language)
      expect(result.processedCharacter!.languages.choices).toHaveLength(1);
      expect(result.processedCharacter!.languages.choices[0].label).toBe('Choose a Language');
      
      // Should have 1 skipped (Giant - not granted)
      expect(result.processedCharacter!.languages.skipped).toHaveLength(1);
      expect(result.processedCharacter!.languages.skipped[0].name).toBe('Giant');

      // Test XML generation
      const processedData: ProcessedCharacterData = {
        characterData,
        name: characterData.name,
        level: 5,
        totalLevel: 5,
        abilities: {},
        inventory: { items: [], totalWeight: 0 },
        spells: {},
        features: {},
        encumbrance: {}
      };

      const xmlResult = await fantasyGroundsFormatter.generateOutput(processedData);
      expect(xmlResult.success).toBe(true);
      expect(xmlResult.output!).toContain('<name type="string">Common</name>');
      expect(xmlResult.output!).toContain('<name type="string">Thieves&apos; Cant</name>');
      expect(xmlResult.output!).not.toContain('<name type="string">Giant</name>'); // Should not include non-granted
      expect(xmlResult.output!).not.toContain('<name type="string">Choose a Language</name>'); // Should not include choices
    });
  });
});