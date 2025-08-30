import type { CharacterData } from '../models/CharacterData';
import type { RacialTrait } from '../models/Features';

interface ProcessedTrait {
  id: string;
  name: string;
  description: string;
  source: 'race' | 'subrace' | 'background' | 'feat' | 'class';
  requiredLevel: number | null;
}

export class TraitProcessor {
  // Traits that should not appear in the traitlist (handled elsewhere in Fantasy Grounds)
  private readonly HIDDEN_TRAITS = [
    "Ability Score Increase", "Ability Score Increases", "Age", "Alignment", "Size", "Speed", 
    "Darkvision", "Superior Darkvision", "Dwarven Combat Training", "Tool Proficiency", 
    "Languages", "Dwarven Toughness", "Cantrip", "Extra Language", "Dwarven Armor Training", 
    "Skill Versatility", "Elven Lineage", "Creature Type", "Elven Lineage Spells",
    // Additional 2024 traits that should be filtered
    "Weapon Mastery", "Criminal Ability Score Improvements", "Hero's Journey Boon", 
    "Dark Bargain", "Core Barbarian Traits", "Core Rogue Traits", "Core Wizard Traits",
    "Core Monk Traits"
  ];

  processAllTraits(characterData: CharacterData): ProcessedTrait[] {
    const traits: ProcessedTrait[] = [];
    const seenTraitNames = new Set<string>();
    const seenTraitIds = new Set<number>();

    // ONLY process racial traits - no background features or feats
    if (characterData.race?.racialTraits) {
      const racialTraits = this.processRacialTraits(characterData.race.racialTraits, characterData.race.isSubRace);
      
      // Add traits with deduplication and filtering
      racialTraits.forEach(trait => {
        // Filter out hidden traits that are handled elsewhere
        if (this.HIDDEN_TRAITS.includes(trait.name)) {
          return;
        }
        
        // Extract numeric ID from trait.id (format: "racial-trait-123")
        const numericId = parseInt(trait.id.replace('racial-trait-', ''));
        
        // Skip if we've already seen this trait name or ID
        if (seenTraitNames.has(trait.name) || seenTraitIds.has(numericId)) {
          return;
        }
        
        // For subrace traits, remove any race trait with the same name
        if (trait.source === 'subrace') {
          const existingIndex = traits.findIndex(t => t.name === trait.name && t.source === 'race');
          if (existingIndex !== -1) {
            traits.splice(existingIndex, 1);
            seenTraitNames.delete(trait.name);
            const existingId = parseInt(traits[existingIndex]?.id?.replace('racial-trait-', '') || '0');
            seenTraitIds.delete(existingId);
          }
        }
        
        traits.push(trait);
        seenTraitNames.add(trait.name);
        seenTraitIds.add(numericId);
      });
    }

    return traits.sort((a, b) => {
      // Sort by source priority (subrace first, then race), then by name
      const sourcePriority = { subrace: 0, race: 1 };
      const priorityA = sourcePriority[a.source] || 99;
      const priorityB = sourcePriority[b.source] || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.name.localeCompare(b.name);
    });
  }

  private processRacialTraits(racialTraits: RacialTrait[], isSubrace: boolean): ProcessedTrait[] {
    return racialTraits.map(trait => ({
      id: `racial-trait-${trait.definition.id}`,
      name: trait.definition.name,
      description: this.cleanDescription(trait.definition.description),
      source: isSubrace ? 'subrace' : 'race',
      requiredLevel: trait.definition.requiredLevel
    }));
  }


  private cleanDescription(description: string): string {
    if (!description) return '';
    
    // Remove HTML tags but preserve basic formatting
    return description
      .replace(/\u003C/g, '<')           // Decode HTML entities
      .replace(/\u003E/g, '>')           // Decode HTML entities
      .replace(/\r\n/g, '\n')            // Normalize line breaks
      .replace(/\r/g, '\n')              // Normalize line breaks
      .replace(/<\/p>\s*<p>/g, '\n\n')   // Convert paragraph breaks to double newlines
      .replace(/<p[^>]*>/g, '')          // Remove opening paragraph tags
      .replace(/<\/p>/g, '')             // Remove closing paragraph tags
      .replace(/<br\s*\/?>/gi, '\n')     // Convert br tags to newlines
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')  // Convert strong to markdown
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')            // Convert em to markdown
      .replace(/<[^>]+>/g, '')           // Remove remaining HTML tags
      .replace(/\n{3,}/g, '\n\n')        // Limit to double newlines max
      .trim();
  }

  generateTraitsXML(traits: ProcessedTrait[]): string {
    if (traits.length === 0) {
      return '';
    }

    let xml = '';
    
    traits.forEach((trait, index) => {
      const id = String(index + 1).padStart(5, '0');
      
      xml += `
			<id-${id}>
				<locked type="number">1</locked>
				<name type="string">${this.escapeXml(trait.name)}</name>
				<text type="formattedtext">`;
      
      // Convert the cleaned description to proper paragraph format
      const paragraphs = trait.description.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        xml += `
					<p>${this.escapeXml(paragraph.trim())}</p>`;
      });
      
      xml += `
				</text>
			</id-${id}>`;
    });

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}