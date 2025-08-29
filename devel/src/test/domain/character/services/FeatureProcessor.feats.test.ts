/**
 * Feature Processor Feats Tests
 * 
 * Tests for the feat processing functionality in FeatureProcessor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureProcessor } from '@/domain/character/services/FeatureProcessor';
import { Feat } from '@/domain/character/models/Features';

describe('FeatureProcessor - Feats Processing', () => {
  let processor: FeatureProcessor;

  beforeEach(() => {
    processor = new FeatureProcessor();
    // Enable debug mode for detailed logging
    FeatureProcessor.setDebugMode(true);
  });

  describe('processFeats', () => {
    it('should process feats from character data', () => {
      const mockCharacterData = {
        classes: [{ definition: { name: 'Fighter' }, level: 4 }],
        race: { fullName: 'Human' },
        feats: [
          {
            componentTypeId: 67468084,
            componentId: 16305,
            definition: {
              id: 1789101,
              entityTypeId: 1088085227,
              definitionKey: "1088085227:1789101",
              name: "Alert",
              description: "<p><em>Origin Feat</em></p>\r\n<p>You gain the following benefits.</p>\r\n<p><em><strong>Initiative Proficiency.</strong></em> When you roll Initiative, you can add your Proficiency Bonus to the roll.</p>\r\n<p><em><strong>Initiative Swap.</strong></em> Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.</p>",
              snippet: "<strong><em>Initiative Proficiency.</em></strong> When you roll Initiative, add {{proficiency#signed}} to the roll.\r\n\r\n<strong><em>Initiative Swap.</em></strong> Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.",
              isHomebrew: false,
              isRepeatable: false,
              categories: [
                {
                  id: 361,
                  entityTypeId: 1088085227,
                  entityId: 1789101,
                  definitionKey: "1088085227:1789101",
                  entityTagId: 11,
                  tagName: "Origin"
                }
              ]
            }
          },
          {
            componentTypeId: 67468084,
            componentId: 16337,
            definition: {
              id: 1789105,
              entityTypeId: 1088085227,
              definitionKey: "1088085227:1789105",
              name: "Weapon Mastery",
              description: "<p><em>General Feat</em></p>\r\n<p>Your training with weapons allows you to use the mastery properties of three kinds of Simple or Martial weapons of your choice. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices.</p>\r\n<p>When you reach certain Levels, you gain additional Mastery properties, as shown in the Weapon Mastery table.</p>",
              isHomebrew: false,
              isRepeatable: false,
              categories: [
                {
                  id: 362,
                  entityTypeId: 1088085227,
                  entityId: 1789105,
                  definitionKey: "1088085227:1789105",
                  entityTagId: 12,
                  tagName: "General"
                }
              ]
            }
          }
        ]
      };

      const options = {
        includeSubclassFeatures: true,
        includeRacialTraits: true,
        includeFeats: true,
        includeDescriptions: true,
        filterByLevel: false,
        maxLevel: 20
      };

      const result = processor.processCharacterFeatures(mockCharacterData as any, options);

      expect(result.feats).toBeDefined();
      expect(result.feats.length).toBe(2);
      expect(result.totalFeatures).toBe(2); // Only feats in this mock data
      
      // Check first feat (Alert)
      const alertFeat = result.feats.find(f => f.name === 'Alert');
      expect(alertFeat).toBeDefined();
      expect(alertFeat?.type).toBe('origin');
      expect(alertFeat?.category).toBe('Origin');
      expect(alertFeat?.isRepeatable).toBe(false);
      expect(alertFeat?.mechanics?.initiative).toBe(true);
      
      // Check second feat (Weapon Mastery)
      const weaponMasteryFeat = result.feats.find(f => f.name === 'Weapon Mastery');
      expect(weaponMasteryFeat).toBeDefined();
      expect(weaponMasteryFeat?.type).toBe('general');
      expect(weaponMasteryFeat?.category).toBe('General');
      expect(weaponMasteryFeat?.isRepeatable).toBe(false);

      // Check feat grouping
      expect(result.featsByCategory).toBeDefined();
      expect(result.featsByCategory['origin']).toBeDefined();
      expect(result.featsByCategory['origin'].length).toBe(1);
      expect(result.featsByCategory['general']).toBeDefined();
      expect(result.featsByCategory['general'].length).toBe(1);

      // Check debug info
      expect(result.debugInfo.featBreakdown).toBeDefined();
      expect(result.debugInfo.featBreakdown.totalFeats).toBe(2);
      expect(result.debugInfo.featBreakdown.originFeats).toBe(1);
      expect(result.debugInfo.featBreakdown.generalFeats).toBe(1);
    });

    it('should handle empty feats array', () => {
      const mockCharacterData = {
        classes: [{ definition: { name: 'Fighter' }, level: 4 }],
        race: { fullName: 'Human' },
        feats: []
      };

      const options = {
        includeSubclassFeatures: true,
        includeRacialTraits: true,
        includeFeats: true,
        includeDescriptions: true,
        filterByLevel: false,
        maxLevel: 20
      };

      const result = processor.processCharacterFeatures(mockCharacterData as any, options);

      expect(result.feats).toBeDefined();
      expect(result.feats.length).toBe(0);
      expect(result.featsByCategory).toEqual({});
      expect(result.debugInfo.featBreakdown.totalFeats).toBe(0);
    });

    it('should handle missing feats property', () => {
      const mockCharacterData = {
        classes: [{ definition: { name: 'Fighter' }, level: 4 }],
        race: { fullName: 'Human' }
        // No feats property
      };

      const options = {
        includeSubclassFeatures: true,
        includeRacialTraits: true,
        includeFeats: true,
        includeDescriptions: true,
        filterByLevel: false,
        maxLevel: 20
      };

      const result = processor.processCharacterFeatures(mockCharacterData as any, options);

      expect(result.feats).toBeDefined();
      expect(result.feats.length).toBe(0);
    });

    it('should skip feat processing when includeFeats is false', () => {
      const mockCharacterData = {
        classes: [{ definition: { name: 'Fighter' }, level: 4 }],
        race: { fullName: 'Human' },
        feats: [
          {
            definition: {
              id: 1789101,
              name: "Alert",
              description: "Test feat",
              categories: []
            }
          }
        ]
      };

      const options = {
        includeSubclassFeatures: true,
        includeRacialTraits: true,
        includeFeats: false, // Disabled
        includeDescriptions: true,
        filterByLevel: false,
        maxLevel: 20
      };

      const result = processor.processCharacterFeatures(mockCharacterData as any, options);

      expect(result.feats).toBeDefined();
      expect(result.feats.length).toBe(0);
    });

    it('should generate feats XML correctly', () => {
      const mockFeats: Feat[] = [
        {
          id: 1789101,
          name: 'Alert',
          description: 'You gain initiative bonuses.',
          category: 'Origin',
          type: 'origin',
          isRepeatable: false,
          mechanics: {
            initiative: true
          }
        },
        {
          id: 1789105,
          name: 'Weapon Mastery',
          description: 'You master weapon properties.',
          category: 'General',
          type: 'general',
          isRepeatable: false
        }
      ];

      const processedFeatures = {
        classFeatures: [],
        racialTraits: [],
        feats: mockFeats,
        totalFeatures: 2,
        featuresByClass: {},
        traitsByRace: {},
        featsByCategory: { origin: [mockFeats[0]], general: [mockFeats[1]] },
        debugInfo: {
          processingMethod: 'single_class' as const,
          classBreakdown: [],
          raceBreakdown: { raceName: 'Human', traitCount: 0 },
          featBreakdown: { totalFeats: 2, originFeats: 1, generalFeats: 1, featCount: 2 },
          warnings: []
        }
      };

      const xml = processor.generateFeatsXML(processedFeatures);

      expect(xml).toContain('id-02000');
      expect(xml).toContain('id-02001');
      expect(xml).toContain('<name type="string">Alert</name>');
      expect(xml).toContain('<name type="string">Weapon Mastery</name>');
      expect(xml).toContain('<source type="string">Origin</source>');
      expect(xml).toContain('<source type="string">General</source>');
    });
  });
});