import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureProcessor } from '../../domain/character/services/FeatureProcessor';
import fs from 'fs';
import path from 'path';

describe('Trait Processing Integration', () => {
  let featureProcessor: FeatureProcessor;

  beforeEach(() => {
    featureProcessor = new FeatureProcessor();
  });

  it('should process traits from real character data', async () => {
    // Load the test character data
    const testCharacterPath = path.join(process.cwd(), '../legacy/data/TestCharacter2_151483095_v05.json');
    
    if (!fs.existsSync(testCharacterPath)) {
      console.warn('Test character file not found, skipping integration test');
      return;
    }

    const characterDataRaw = fs.readFileSync(testCharacterPath, 'utf-8');
    const characterResponse = JSON.parse(characterDataRaw);
    const characterData = characterResponse.data;

    // Process traits
    const traitsXML = featureProcessor.generateTraitsXML(characterData);

    // Verify the XML structure (should contain trait entries but not traitlist wrapper)
    expect(traitsXML).not.toContain('<traitlist>');
    expect(traitsXML).not.toContain('</traitlist>');
    
    // Should contain exactly the Goliath racial traits (no duplicates, no filtered traits)
    expect(traitsXML).toContain('Giant Ancestry');
    expect(traitsXML).toContain('Large Form');
    expect(traitsXML).toContain('Powerful Build');
    
    // Should NOT contain filtered traits
    expect(traitsXML).not.toContain('Ability Score');
    expect(traitsXML).not.toContain('Size');
    expect(traitsXML).not.toContain('Speed');
    expect(traitsXML).not.toContain('Languages');
    expect(traitsXML).not.toContain('Creature Type');
    
    // Should contain proper XML structure
    expect(traitsXML).toContain('<locked type="number">1</locked>');
    expect(traitsXML).toContain('<text type="formattedtext">');
    
    // Should not contain encoded HTML entities
    expect(traitsXML).not.toContain('\u003Cp\u003E');
    expect(traitsXML).not.toContain('\u003C/p\u003E');
    
    // Should contain properly formatted paragraph tags
    expect(traitsXML).toContain('<p>');
    expect(traitsXML).toContain('</p>');

    console.log('Generated Traits XML:');
    console.log(traitsXML);
  });

  it('should handle character with no racial traits gracefully', () => {
    const emptyCharacterData = {
      race: null
    };

    const traitsXML = featureProcessor.generateTraitsXML(emptyCharacterData as any);
    
    expect(traitsXML).toBe('');
  });
});