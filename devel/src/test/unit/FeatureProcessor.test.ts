/**
 * FeatureProcessor Unit Tests
 * 
 * Tests the modernized feature processing logic extracted from legacy characterParser.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureProcessor } from '@/domain/character/services/FeatureProcessor';
import { 
  ClassFeature, 
  RacialTrait, 
  FeatureValidator,
  FeatureLevel,
  FeatureUsage 
} from '@/domain/character/models/Features';

describe('FeatureProcessor', () => {
  let processor: FeatureProcessor;

  beforeEach(() => {
    processor = new FeatureProcessor();
  });

  describe('Class Feature Processing', () => {
    it('should process fighter class features correctly', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 3,
          definition: {
            id: 1,
            name: 'Fighter',
            classFeatures: [
              {
                id: 1,
                name: 'Fighting Style',
                description: 'Choose a fighting style that gives you benefits in combat.',
                requiredLevel: 1
              },
              {
                id: 2,
                name: 'Second Wind',
                description: 'You have a limited well of stamina that you can draw on.',
                requiredLevel: 1
              },
              {
                id: 3,
                name: 'Action Surge',
                description: 'You can push yourself beyond your normal limits.',
                requiredLevel: 2
              }
            ]
          }
        }],
        race: {
          id: 1,
          fullName: 'Human',
          racialTraits: []
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      expect(result.classFeatures).toHaveLength(3);
      expect(result.racialTraits).toHaveLength(0);
      expect(result.totalFeatures).toBe(3);
      expect(result.debugInfo.processingMethod).toBe('single_class');
      
      // Check specific features
      const fightingStyle = result.classFeatures.find(f => f.name === 'Fighting Style');
      expect(fightingStyle).toBeDefined();
      expect(fightingStyle?.className).toBe('fighter');
      expect(fightingStyle?.type).toBe('passive');
      
      const secondWind = result.classFeatures.find(f => f.name === 'Second Wind');
      expect(secondWind).toBeDefined();
      expect(secondWind?.type).toBe('resource');
      expect(secondWind?.uses?.type).toBe('short_rest');
    });

    it('should process barbarian with subclass features', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 3,
          definition: {
            id: 1,
            name: 'Barbarian',
            classFeatures: [
              {
                id: 1,
                name: 'Rage',
                description: 'In battle, you fight with primal ferocity.',
                requiredLevel: 1
              }
            ]
          },
          subclassDefinition: {
            id: 1,
            name: 'Path of the Totem Warrior',
            classFeatures: [
              {
                id: 2,
                name: 'Totem Spirit',
                description: 'You gain a totem spirit that affects your rage.',
                requiredLevel: 3
              }
            ]
          }
        }],
        race: {
          id: 1,
          fullName: 'Half-Orc',
          racialTraits: []
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      expect(result.classFeatures).toHaveLength(2);
      expect(result.featuresByClass['barbarian (path of the totem warrior)']).toHaveLength(1);
      
      const rage = result.classFeatures.find(f => f.name === 'Rage');
      expect(rage?.type).toBe('resource');
      expect(rage?.uses?.type).toBe('long_rest');
      
      const totemSpirit = result.classFeatures.find(f => f.name === 'Totem Spirit');
      expect(totemSpirit?.source).toBe('subclass');
      expect(totemSpirit?.subclassName).toBe('Path of the Totem Warrior');
    });

    it('should handle multiclass characters', () => {
      const mockCharacterData = {
        classes: [
          {
            id: 1,
            level: 2,
            definition: {
              id: 1,
              name: 'Fighter',
              classFeatures: [
                {
                  id: 1,
                  name: 'Fighting Style',
                  description: 'Choose a fighting style.',
                  requiredLevel: 1
                },
                {
                  id: 2,
                  name: 'Action Surge',
                  description: 'Push beyond normal limits.',
                  requiredLevel: 2
                }
              ]
            }
          },
          {
            id: 2,
            level: 1,
            definition: {
              id: 2,
              name: 'Rogue',
              classFeatures: [
                {
                  id: 3,
                  name: 'Sneak Attack',
                  description: 'Deal extra damage with finesse weapons.',
                  requiredLevel: 1
                }
              ]
            }
          }
        ],
        race: {
          id: 1,
          fullName: 'Human',
          racialTraits: []
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      expect(result.classFeatures).toHaveLength(3);
      expect(result.debugInfo.processingMethod).toBe('multiclass');
      expect(result.featuresByClass).toHaveProperty('fighter');
      expect(result.featuresByClass).toHaveProperty('rogue');
      expect(result.featuresByClass['fighter']).toHaveLength(2);
      expect(result.featuresByClass['rogue']).toHaveLength(1);
    });
  });

  describe('Racial Trait Processing', () => {
    it('should process elf racial traits', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 1,
          definition: {
            id: 1,
            name: 'Wizard',
            classFeatures: []
          }
        }],
        race: {
          id: 1,
          fullName: 'Elf',
          racialTraits: [
            {
              id: 1,
              definition: {
                id: 1,
                name: 'Darkvision',
                description: 'You can see in dim light within 60 feet as if it were bright light.'
              }
            },
            {
              id: 2,
              definition: {
                id: 2,
                name: 'Fey Ancestry',
                description: 'You have advantage on saving throws against being charmed.'
              }
            }
          ]
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      expect(result.racialTraits).toHaveLength(2);
      expect(result.traitsByRace['elf']).toHaveLength(2);
      
      const darkvision = result.racialTraits.find(t => t.name === 'Darkvision');
      expect(darkvision).toBeDefined();
      expect(darkvision?.type).toBe('passive');
      expect(darkvision?.mechanics?.darkvisionRange).toBe(60);
      
      const feyAncestry = result.racialTraits.find(t => t.name === 'Fey Ancestry');
      expect(feyAncestry?.type).toBe('passive');
    });

    it('should process dragonborn with subrace traits', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 1,
          definition: {
            id: 1,
            name: 'Sorcerer',
            classFeatures: []
          }
        }],
        race: {
          id: 1,
          fullName: 'Dragonborn',
          racialTraits: [
            {
              id: 1,
              definition: {
                id: 1,
                name: 'Draconic Ancestry',
                description: 'You have draconic ancestry.'
              }
            }
          ],
          subraceDefinition: {
            id: 1,
            name: 'Red Dragonborn',
            racialTraits: [
              {
                id: 2,
                definition: {
                  id: 2,
                  name: 'Breath Weapon',
                  description: 'You can use your action to exhale destructive energy.'
                }
              }
            ]
          }
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      expect(result.racialTraits).toHaveLength(2);
      
      const ancestry = result.racialTraits.find(t => t.name === 'Draconic Ancestry');
      expect(ancestry?.source).toBe('race');
      
      const breathWeapon = result.racialTraits.find(t => t.name === 'Breath Weapon');
      expect(breathWeapon?.source).toBe('subrace');
      expect(breathWeapon?.suraceName).toBe('Red Dragonborn');
      expect(breathWeapon?.type).toBe('active');
    });
  });

  describe('XML Generation', () => {
    it('should generate proper features XML', () => {
      const mockFeatures = {
        classFeatures: [
          {
            id: 1,
            name: 'Test Feature',
            description: 'A test class feature',
            requiredLevel: 1,
            className: 'fighter',
            source: 'class' as const,
            type: 'passive' as const
          }
        ],
        racialTraits: [
          {
            id: 2,
            name: 'Test Trait',
            description: 'A test racial trait',
            raceName: 'human',
            source: 'race' as const,
            type: 'passive' as const
          }
        ],
        totalFeatures: 2,
        featuresByClass: {},
        traitsByRace: {},
        debugInfo: {
          processingMethod: 'single_class' as const,
          classBreakdown: [],
          raceBreakdown: { raceName: 'human', traitCount: 1 },
          warnings: []
        }
      };

      const featuresXML = processor.generateFeaturesXML(mockFeatures);
      const traitsXML = processor.generateTraitsXML(mockFeatures);
      
      // Test class features XML
      expect(featuresXML).toContain('<name type="string">Test Feature</name>');
      expect(featuresXML).toContain('<source type="string">fighter</source>');
      expect(featuresXML).toContain('<locked type="number">1</locked>');
      
      // Test racial traits XML  
      expect(traitsXML).toContain('<name type="string">Test Trait</name>');
      expect(traitsXML).toContain('<source type="string">human</source>');
      expect(traitsXML).toContain('<locked type="number">1</locked>');
    });
  });

  describe('Data Validation', () => {
    it('should validate valid character data', () => {
      const validData = {
        classes: [{
          id: 1,
          level: 5,
          definition: {
            id: 1,
            name: 'Wizard',
            classFeatures: []
          }
        }],
        race: {
          id: 1,
          fullName: 'Human',
          racialTraits: []
        }
      };

      const validation = FeatureProcessor.validateCharacterData(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid character data', () => {
      const invalidData = {
        classes: 'not an array',
        race: null
      };

      const validation = FeatureProcessor.validateCharacterData(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Character classes must be an array');
      expect(validation.errors).toContain('Character race is required');
    });
  });

  describe('Feature Filtering', () => {
    it('should filter features by level when enabled', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 2, // Character is only level 2
          definition: {
            id: 1,
            name: 'Fighter',
            classFeatures: [
              {
                id: 1,
                name: 'Fighting Style',
                description: 'Choose a fighting style.',
                requiredLevel: 1
              },
              {
                id: 2,
                name: 'Action Surge',
                description: 'Push beyond normal limits.',
                requiredLevel: 2
              },
              {
                id: 3,
                name: 'Extra Attack',
                description: 'You can attack twice.',
                requiredLevel: 5 // Should be filtered out
              }
            ]
          }
        }],
        race: {
          id: 1,
          fullName: 'Human',
          racialTraits: []
        }
      };

      const options = {
        includeSubclassFeatures: true,
        includeRacialTraits: true,
        includeDescriptions: true,
        filterByLevel: true,
        maxLevel: 20
      };

      const result = processor.processCharacterFeatures(mockCharacterData, options);
      
      expect(result.classFeatures).toHaveLength(2); // Only level 1 and 2 features
      expect(result.classFeatures.find(f => f.name === 'Extra Attack')).toBeUndefined();
    });
  });

  describe('Feature Exclusion', () => {
    it('should skip excluded features like Proficiencies, Ability Score Increase, Core Sorcerer Traits, and Metamagic Options', () => {
      const mockCharacterData = {
        classes: [{
          id: 1,
          level: 4,
          definition: {
            id: 1,
            name: 'Fighter',
            classFeatures: [
              {
                id: 1,
                name: 'Fighting Style',
                description: 'Choose a fighting style.',
                requiredLevel: 1
              },
              {
                id: 2,
                name: 'Proficiencies',
                description: 'You gain proficiency with armor and weapons.',
                requiredLevel: 1
              },
              {
                id: 3,
                name: 'Ability Score Increase',
                description: 'Increase your ability scores.',
                requiredLevel: 4
              },
              {
                id: 4,
                name: 'Extra Attack',
                description: 'You can attack twice.',
                requiredLevel: 5
              },
              {
                id: 5,
                name: 'Core Sorcerer Traits',
                description: 'Core traits for sorcerer class.',
                requiredLevel: 1
              },
              {
                id: 6,
                name: 'Metamagic Options',
                description: 'Choose metamagic options.',
                requiredLevel: 3
              }
            ]
          }
        }],
        race: {
          id: 1,
          fullName: 'Human',
          racialTraits: [
            {
              id: 5,
              definition: {
                id: 5,
                name: 'Extra Language',
                description: 'You can speak an additional language.'
              }
            },
            {
              id: 6,
              definition: {
                id: 6,
                name: 'Skill Proficiencies',
                description: 'You gain proficiency in skills.'
              }
            }
          ]
        }
      };

      const result = processor.processCharacterFeatures(mockCharacterData);
      
      // Should only have Fighting Style (excluded: Proficiencies, Ability Score Increase, Core Sorcerer Traits, Metamagic Options)
      expect(result.classFeatures).toHaveLength(1);
      expect(result.classFeatures[0].name).toBe('Fighting Style');
      
      // Should only have Extra Language (not Skill Proficiencies)
      expect(result.racialTraits).toHaveLength(1);
      expect(result.racialTraits[0].name).toBe('Extra Language');
      
      // Total should be 2 (1 class feature + 1 racial trait)
      expect(result.totalFeatures).toBe(2);
    });
  });

  describe('Debug Mode', () => {
    it('should enable and disable debug mode', () => {
      expect(() => FeatureProcessor.setDebugMode(true)).not.toThrow();
      expect(() => FeatureProcessor.setDebugMode(false)).not.toThrow();
    });
  });
});

describe('FeatureValidator', () => {
  describe('Class Feature Validation', () => {
    it('should validate valid class feature', () => {
      const validFeature: Partial<ClassFeature> = {
        name: 'Test Feature',
        className: 'fighter',
        requiredLevel: 5,
        type: 'passive'
      };

      const validation = FeatureValidator.validateClassFeature(validFeature);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid class feature', () => {
      const invalidFeature: Partial<ClassFeature> = {
        name: '',
        className: '',
        requiredLevel: 25,
        type: 'invalid' as any
      };

      const validation = FeatureValidator.validateClassFeature(invalidFeature);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Feature name is required');
      expect(validation.errors).toContain('Class name is required');
      expect(validation.errors).toContain('Required level must be between 1 and 20');
      expect(validation.errors).toContain('Feature type must be passive, active, resource, or spell');
    });
  });

  describe('Racial Trait Validation', () => {
    it('should validate valid racial trait', () => {
      const validTrait: Partial<RacialTrait> = {
        name: 'Darkvision',
        raceName: 'elf',
        type: 'passive'
      };

      const validation = FeatureValidator.validateRacialTrait(validTrait);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid racial trait', () => {
      const invalidTrait: Partial<RacialTrait> = {
        name: '',
        raceName: '',
        type: 'invalid' as any
      };

      const validation = FeatureValidator.validateRacialTrait(invalidTrait);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Trait name is required');
      expect(validation.errors).toContain('Race name is required');
    });
  });
});

describe('Value Objects', () => {
  describe('FeatureLevel', () => {
    it('should create valid feature level', () => {
      const level = new FeatureLevel(5);
      expect(level.level).toBe(5);
      expect(level.toString()).toBe('5');
      expect(level.canAccessFeature(3)).toBe(true);
      expect(level.canAccessFeature(7)).toBe(false);
    });

    it('should reject invalid levels', () => {
      expect(() => new FeatureLevel(0)).toThrow('Feature level must be between 1 and 20');
      expect(() => new FeatureLevel(21)).toThrow('Feature level must be between 1 and 20');
    });
  });

  describe('FeatureUsage', () => {
    it('should create valid feature usage', () => {
      const usage = new FeatureUsage('short_rest', 2);
      expect(usage.type).toBe('short_rest');
      expect(usage.amount).toBe(2);
      expect(usage.requiresRest()).toBe(true);
      expect(usage.isUnlimited()).toBe(false);
    });

    it('should identify unlimited usage', () => {
      const usage = new FeatureUsage('unlimited', 0);
      expect(usage.isUnlimited()).toBe(true);
      expect(usage.requiresRest()).toBe(false);
    });

    it('should reject negative amounts', () => {
      expect(() => new FeatureUsage('long_rest', -1)).toThrow('Feature usage amount cannot be negative');
    });
  });
});