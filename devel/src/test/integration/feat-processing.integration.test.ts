/**
 * Integration Test - Feat Processing
 * 
 * Tests the complete feat processing pipeline from character data
 * through the FantasyGroundsXMLFormatter to verify feats appear in the XML output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FantasyGroundsXMLFormatter } from '@/domain/export/formatters/FantasyGroundsXMLFormatter';
import { featureFlags } from '@/core/FeatureFlags';

describe('Integration: Feat Processing Pipeline', () => {
  let formatter: FantasyGroundsXMLFormatter;

  beforeEach(() => {
    formatter = new FantasyGroundsXMLFormatter();
    
    // Enable feature flags needed for feat processing
    featureFlags.enable('feature_processor');
    featureFlags.enable('feature_processor_debug');
  });

  it('should generate complete Fantasy Grounds XML with feats included', async () => {
    const mockProcessedData = {
      characterData: {
        id: '151483095',
        name: 'Test Character',
        classes: [
          {
            definition: { name: 'Fighter' },
            level: 4,
            classFeatures: []
          }
        ],
        race: {
          fullName: 'Human',
          racialTraits: []
        },
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
        ],
        stats: [
          { id: 1, value: 15 }, // Strength
          { id: 2, value: 14 }, // Dexterity  
          { id: 3, value: 13 }, // Constitution
          { id: 4, value: 12 }, // Intelligence
          { id: 5, value: 11 }, // Wisdom
          { id: 6, value: 10 }  // Charisma
        ],
        inventory: [],
        spells: { class: [], race: [], background: [], item: [], feat: [] },
        proficiencies: []
      },
      totalLevel: 4,
      isPrimarilySpellcaster: false,
      spellcastingClasses: [],
      characterClasses: [
        { name: 'Fighter', level: 4 }
      ]
    };

    const result = await formatter.generateOutput(mockProcessedData as any);

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    
    const xml = result.output!;
    
    // Verify the XML contains a featlist section
    expect(xml).toContain('<featlist>');
    expect(xml).toContain('</featlist>');
    
    // Verify that our feats appear in the XML
    expect(xml).toContain('Alert');
    expect(xml).toContain('Weapon Mastery');
    
    // Verify the XML structure includes feat entries with proper IDs
    expect(xml).toContain('id-02000'); // First feat
    expect(xml).toContain('id-02001'); // Second feat
    
    // Verify feat metadata is included
    expect(xml).toContain('<source type="string">Origin</source>');
    expect(xml).toContain('<source type="string">General</source>');
    
    console.log('Generated XML sample:', xml.slice(0, 1000) + '...');
  });

  it('should handle characters with no feats gracefully', async () => {
    const mockProcessedDataNoFeats = {
      characterData: {
        id: '151483095',
        name: 'Test Character No Feats',
        classes: [
          {
            definition: { name: 'Fighter' },
            level: 4,
            classFeatures: []
          }
        ],
        race: {
          fullName: 'Human',
          racialTraits: []
        },
        feats: [], // Empty feats array
        stats: [
          { id: 1, value: 15 }, // Strength
          { id: 2, value: 14 }, // Dexterity  
          { id: 3, value: 13 }, // Constitution
          { id: 4, value: 12 }, // Intelligence
          { id: 5, value: 11 }, // Wisdom
          { id: 6, value: 10 }  // Charisma
        ],
        inventory: [],
        spells: { class: [], race: [], background: [], item: [], feat: [] },
        proficiencies: []
      },
      totalLevel: 4,
      isPrimarilySpellcaster: false,
      spellcastingClasses: [],
      characterClasses: [
        { name: 'Fighter', level: 4 }
      ]
    };

    const result = await formatter.generateOutput(mockProcessedDataNoFeats as any);

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    
    const xml = result.output!;
    
    // Verify the XML still contains a featlist section (even if empty)
    expect(xml).toContain('<featlist>');
    expect(xml).toContain('</featlist>');
    
    // Verify no feat IDs appear in the XML
    expect(xml).not.toContain('id-02000');
    expect(xml).not.toContain('Alert');
    expect(xml).not.toContain('Weapon Mastery');
  });
});