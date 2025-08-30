/**
 * Proficiency Processor
 * 
 * Extracts and processes equipment/tool proficiencies from D&D Beyond character data.
 * Part of the modern TypeScript character processing pipeline.
 * 
 * Handles:
 * - Weapon proficiencies (categories and specific weapons)
 * - Armor proficiencies (light, medium, heavy, shields)
 * - Tool proficiencies (artisan's tools, thieves' tools, etc.)
 * - Proficiency deduplication and categorization
 */

import type { CharacterData, CharacterModifier } from './CharacterFetcher';
import { 
  ProficiencyUtils, 
  ProficiencyEntry, 
  ProficiencyCategory,
  DNDB_ENTITY_TYPES,
  ALL_PROFICIENCY_MAPPINGS 
} from '../constants/ProficiencyConstants';

/**
 * Processed proficiency data structure
 */
export interface ProcessedProficiencies {
  readonly weapons: ProficiencyEntry[];
  readonly armor: ProficiencyEntry[];
  readonly tools: ProficiencyEntry[];
  readonly all: ProficiencyEntry[];
  readonly skippedProficiencies: SkippedProficiency[];
  readonly debugInfo: {
    readonly totalFound: number;
    readonly totalMapped: number;
    readonly totalSkipped: number;
    readonly sources: string[];
  };
}

/**
 * Proficiency that couldn't be mapped
 */
export interface SkippedProficiency {
  readonly source: string;
  readonly subType: string;
  readonly entityTypeId: number | null;
  readonly friendlyName: string;
  readonly reason: string;
}

/**
 * Proficiency Processor - Standalone Service
 */
export class ProficiencyProcessor {
  
  /**
   * Process proficiencies from D&D Beyond character data
   */
  processProficiencies(character: CharacterData): ProcessedProficiencies {
    try {
      return this.extractProficiencies(character);
    } catch (error) {
      console.error('Failed to process proficiencies:', error);
      return {
        weapons: [],
        armor: [],
        tools: [],
        all: [],
        skippedProficiencies: [],
        debugInfo: {
          totalFound: 0,
          totalMapped: 0,
          totalSkipped: 0,
          sources: []
        }
      };
    }
  }
  
  /**
   * Extract all equipment/tool proficiencies from character modifiers
   */
  private extractProficiencies(character: CharacterData): ProcessedProficiencies {
    const allProficiencies: ProficiencyEntry[] = [];
    const skippedProficiencies: SkippedProficiency[] = [];
    const sources = new Set<string>();
    const seenProficiencies = new Set<string>(); // Track by source to avoid exact duplicates
    
    // Extract from all modifier sources
    if (character.modifiers) {
      const modifierSources = ['class', 'race', 'background', 'feat', 'item'] as const;
      
      for (const source of modifierSources) {
        const modifiers = character.modifiers[source];
        if (modifiers && Array.isArray(modifiers)) {
          const sourceProficiencies = this.extractFromModifiers(
            modifiers, 
            source, 
            skippedProficiencies, 
            seenProficiencies
          );
          allProficiencies.push(...sourceProficiencies);
          if (sourceProficiencies.length > 0) {
            sources.add(source);
          }
        }
      }
    }
    
    // Apply intelligent deduplication (prefer categories over specific items)
    const deduplicatedProficiencies = ProficiencyUtils.deduplicateProficiencies(allProficiencies);
    
    // Categorize proficiencies
    const weapons = ProficiencyUtils.filterByCategory(deduplicatedProficiencies, 'weapon');
    const armor = ProficiencyUtils.filterByCategory(deduplicatedProficiencies, 'armor');
    const tools = ProficiencyUtils.filterByCategory(deduplicatedProficiencies, 'tool');
    
    return {
      weapons,
      armor,
      tools,
      all: deduplicatedProficiencies,
      skippedProficiencies,
      debugInfo: {
        totalFound: allProficiencies.length,
        totalMapped: deduplicatedProficiencies.length,
        totalSkipped: skippedProficiencies.length,
        sources: Array.from(sources)
      }
    };
  }
  
  /**
   * Extract proficiencies from a specific modifier source
   */
  private extractFromModifiers(
    modifiers: CharacterModifier[], 
    source: string,
    skippedProficiencies: SkippedProficiency[],
    seenProficiencies: Set<string>
  ): ProficiencyEntry[] {
    const proficiencies: ProficiencyEntry[] = [];
    
    for (const modifier of modifiers) {
      // Only process proficiency type modifiers
      if (modifier.type !== 'proficiency') {
        continue;
      }
      
      // Skip skill and saving throw proficiencies (handled elsewhere)
      if (this.isSkillOrSavingThrowProficiency(modifier)) {
        continue;
      }
      
      // Skip choice proficiencies that aren't resolved
      if (this.isUnresolvedChoiceProficiency(modifier)) {
        skippedProficiencies.push({
          source,
          subType: modifier.subType || '',
          entityTypeId: modifier.entityTypeId || null,
          friendlyName: modifier.friendlySubtypeName || modifier.subType || '',
          reason: 'Unresolved choice proficiency'
        });
        continue;
      }
      
      // Try to map the proficiency
      const proficiencyEntry = this.mapProficiency(modifier, source);
      
      if (proficiencyEntry) {
        // Check if we've already seen this exact proficiency
        const proficiencyKey = proficiencyEntry.source;
        if (seenProficiencies.has(proficiencyKey)) {
          // Skip duplicate - already processed from another source
          continue;
        }
        
        // Mark as seen and add to results
        seenProficiencies.add(proficiencyKey);
        proficiencies.push(proficiencyEntry);
      } else {
        skippedProficiencies.push({
          source,
          subType: modifier.subType || '',
          entityTypeId: modifier.entityTypeId || null,
          friendlyName: modifier.friendlySubtypeName || modifier.subType || '',
          reason: 'No mapping found'
        });
      }
    }
    
    return proficiencies;
  }
  
  /**
   * Check if modifier is a skill or saving throw proficiency
   */
  private isSkillOrSavingThrowProficiency(modifier: CharacterModifier): boolean {
    if (modifier.entityTypeId === DNDB_ENTITY_TYPES.SKILL) {
      return true;
    }
    
    if (modifier.subType?.includes('saving-throws')) {
      return true;
    }
    
    // Check for skill names
    const skillNames = [
      'acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception',
      'history', 'insight', 'intimidation', 'investigation', 'medicine',
      'nature', 'perception', 'performance', 'persuasion', 'religion',
      'sleight-of-hand', 'stealth', 'survival'
    ];
    
    return skillNames.includes(modifier.subType || '');
  }
  
  /**
   * Check if modifier is an unresolved choice proficiency
   */
  private isUnresolvedChoiceProficiency(modifier: CharacterModifier): boolean {
    const subType = modifier.subType || '';
    return subType.startsWith('choose-') || subType.includes('choice');
  }
  
  /**
   * Map a D&D Beyond modifier to a proficiency entry
   */
  private mapProficiency(modifier: CharacterModifier, source: string): ProficiencyEntry | null {
    const subType = modifier.subType || '';
    const entityTypeId = modifier.entityTypeId || 0;
    
    // Get display name from our mapping
    const displayName = ProficiencyUtils.getDisplayName(subType);
    if (!displayName) {
      return null;
    }
    
    // Determine category
    const category = ProficiencyUtils.getCategoryByEntityType(entityTypeId);
    if (!category) {
      return null;
    }
    
    return {
      source: subType,
      display: displayName,
      category,
      entityTypeId
    };
  }
  
  /**
   * Generate Fantasy Grounds proficiencylist XML
   */
  generateFantasyGroundsXML(proficiencies: ProcessedProficiencies): string {
    const xmlEntries: string[] = [];
    let entryIndex = 1;
    
    // Add weapon proficiencies
    for (const weapon of proficiencies.weapons) {
      const id = `id-${entryIndex.toString().padStart(5, '0')}`;
      xmlEntries.push(
        `\t\t\t<${id}>\n\t\t\t\t<name type="string">Weapon: ${weapon.display}</name>\n\t\t\t</${id}>`
      );
      entryIndex++;
    }
    
    // Add armor proficiencies
    for (const armorProf of proficiencies.armor) {
      const id = `id-${entryIndex.toString().padStart(5, '0')}`;
      xmlEntries.push(
        `\t\t\t<${id}>\n\t\t\t\t<name type="string">Armor: ${armorProf.display}</name>\n\t\t\t</${id}>`
      );
      entryIndex++;
    }
    
    // Add tool proficiencies
    for (const tool of proficiencies.tools) {
      const id = `id-${entryIndex.toString().padStart(5, '0')}`;
      xmlEntries.push(
        `\t\t\t<${id}>\n\t\t\t\t<name type="string">Tool: ${tool.display}</name>\n\t\t\t</${id}>`
      );
      entryIndex++;
    }
    
    if (xmlEntries.length === 0) {
      return '\t\t<proficiencylist />';
    }
    
    return [
      '\t\t<proficiencylist>',
      ...xmlEntries,
      '\t\t</proficiencylist>'
    ].join('\n');
  }
  
  /**
   * Generate Foundry VTT proficiency data (for future implementation)
   */
  generateFoundryVTTData(proficiencies: ProcessedProficiencies): {
    weaponProf: { value: string[]; custom: string };
    armorProf: { value: string[]; custom: string };
    toolProf: { value: string[]; custom: string };
  } {
    return {
      weaponProf: {
        value: proficiencies.weapons.map(w => w.source),
        custom: ''
      },
      armorProf: {
        value: proficiencies.armor.map(a => a.source),
        custom: ''
      },
      toolProf: {
        value: proficiencies.tools.map(t => t.source),
        custom: ''
      }
    };
  }
}