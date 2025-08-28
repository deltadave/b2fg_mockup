/**
 * Fantasy Grounds XML Output Formatter
 * 
 * Converts processed character data to Fantasy Grounds Unity/Classic XML format.
 * This is the primary production format for the D&D Beyond converter.
 */

import type { 
  OutputFormatter, 
  FormatOptions, 
  FormatResult, 
  ProcessedCharacterData,
  FormatError,
  FormatWarning
} from '../interfaces/OutputFormatter';
import { gameConfigService } from '../../../shared/services/GameConfigService';
import { StringSanitizer } from '../../../shared/utils/StringSanitizer';
import { SafeAccess } from '../../../shared/utils/SafeAccess';

export class FantasyGroundsXMLFormatter implements OutputFormatter {
  readonly format = 'fantasy-grounds-xml';
  readonly version = '1.0';
  readonly supportedFeatures = [
    'abilities', 'skills', 'saving-throws', 'combat', 'spells', 'spell-slots',
    'equipment', 'weapons', 'armor', 'features', 'feats', 'proficiencies',
    'multiclass', 'homebrew-support'
  ];

  async generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult> {
    try {
      const character = processedData.characterData;
      const errors: FormatError[] = [];
      const warnings: FormatWarning[] = [];

      // Build Fantasy Grounds XML structure
      const xml = this.buildFantasyGroundsXML(processedData, options);
      
      if (!xml || xml.length === 0) {
        return {
          success: false,
          errors: [{
            type: 'generation_error',
            message: 'Failed to generate Fantasy Grounds XML - empty output'
          }]
        };
      }

      // Generate filename
      const sanitizedName = StringSanitizer.sanitizeText(character.name || 'character')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const characterId = character.id || 'unknown';
      const filename = `${sanitizedName}_${characterId}_fg.xml`;

      return {
        success: true,
        output: xml,
        filename,
        mimeType: 'application/xml',
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          type: 'generation_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred during Fantasy Grounds export'
        }]
      };
    }
  }

  private buildFantasyGroundsXML(processedData: ProcessedCharacterData, options?: FormatOptions): string {
    const character = processedData.characterData;
    const totalLevel = processedData.totalLevel || 1;
    
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root version="4.1" dataversion="20210302">',
      '  <character>',
      this.buildBasicInfo(character, totalLevel),
      this.buildAbilities(character),
      this.buildSkills(character, processedData),
      this.buildCombatStats(character, processedData),
      this.buildSpells(character, processedData, options),
      this.buildEquipment(character, options),
      this.buildFeatures(character, options),
      '  </character>',
      '</root>'
    ];

    return xml.join('\n');
  }

  private buildBasicInfo(character: any, totalLevel: number): string {
    const name = StringSanitizer.sanitizeText(character.name || 'Unknown Character');
    const raceName = SafeAccess.get(character, 'race.fullName') || SafeAccess.get(character, 'race.name') || '';
    const className = character.classes?.map(cls => `${cls.definition?.name} ${cls.level}`).join(', ') || '';
    const background = SafeAccess.get(character, 'background.name') || '';
    const alignment = gameConfigService.getAlignmentName(character.alignmentId) || '';

    return [
      `    <name type="string">${name}</name>`,
      `    <race type="string">${StringSanitizer.sanitizeText(raceName)}</race>`,
      `    <classes type="string">${StringSanitizer.sanitizeText(className)}</classes>`,
      `    <background type="string">${StringSanitizer.sanitizeText(background)}</background>`,
      `    <alignment type="string">${StringSanitizer.sanitizeText(alignment)}</alignment>`,
      `    <level type="number">${totalLevel}</level>`,
      `    <exp type="number">${character.currentXp || 0}</exp>`
    ].join('\n');
  }

  private buildAbilities(character: any): string {
    const stats = SafeAccess.get(character, 'stats') || [];
    const abilityMapping = {
      1: 'strength',     2: 'dexterity',    3: 'constitution',
      4: 'intelligence', 5: 'wisdom',       6: 'charisma'
    };

    const abilities = ['    <abilities>'];
    
    for (const stat of stats) {
      const abilityName = abilityMapping[stat.id];
      if (abilityName) {
        const score = stat.value || 10;
        const modifier = Math.floor((score - 10) / 2);
        const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        
        abilities.push(`      <${abilityName}>`);
        abilities.push(`        <score type="number">${score}</score>`);
        abilities.push(`        <bonus type="number">${modifier}</bonus>`);
        abilities.push(`        <text type="string">${score} (${modifierStr})</text>`);
        abilities.push(`      </${abilityName}>`);
      }
    }
    
    abilities.push('    </abilities>');
    return abilities.join('\n');
  }

  private buildSkills(character: any, processedData: ProcessedCharacterData): string {
    const skills = ['    <skilllist>'];
    
    // Fantasy Grounds skill structure - simplified implementation
    const skillNames = [
      'acrobatics', 'animalhandling', 'arcana', 'athletics', 'deception',
      'history', 'insight', 'intimidation', 'investigation', 'medicine',
      'nature', 'perception', 'performance', 'persuasion', 'religion',
      'sleightofhand', 'stealth', 'survival'
    ];

    for (const skillName of skillNames) {
      skills.push(`      <${skillName}>`);
      skills.push(`        <total type="number">0</total>`);
      skills.push(`        <state type="number">0</state>`);
      skills.push(`      </${skillName}>`);
    }
    
    skills.push('    </skilllist>');
    return skills.join('\n');
  }

  private buildCombatStats(character: any, processedData: ProcessedCharacterData): string {
    const stats = SafeAccess.get(character, 'stats') || [];
    const dexStat = stats.find(stat => stat.id === 2);
    const dexModifier = dexStat ? Math.floor((dexStat.value - 10) / 2) : 0;
    const conStat = stats.find(stat => stat.id === 3);
    const conModifier = conStat ? Math.floor((conStat.value - 10) / 2) : 0;
    
    const baseHP = SafeAccess.get(character, 'baseHitPoints') || 0;
    const bonusHP = SafeAccess.get(character, 'bonusHitPoints') || 0;
    const totalHP = Math.max(1, baseHP + bonusHP + (conModifier * (processedData.totalLevel || 1)));
    
    const ac = 10 + dexModifier; // Base AC, armor will be added separately
    const proficiencyBonus = processedData.proficiencyBonus || 2;
    const speed = SafeAccess.get(character, 'race.movementSpeed') || 30;

    return [
      '    <hp>',
      `      <total type="number">${totalHP}</total>`,
      `      <current type="number">${totalHP}</current>`,
      '    </hp>',
      `    <ac type="number">${ac}</ac>`,
      `    <speed type="number">${speed}</speed>`,
      `    <profbonus type="number">${proficiencyBonus}</profbonus>`
    ].join('\n');
  }

  private buildSpells(character: any, processedData: ProcessedCharacterData, options?: FormatOptions): string {
    const spells = SafeAccess.get(character, 'spells.class') || [];
    
    if (spells.length === 0) {
      return '    <spellset />';
    }

    const spellXml = ['    <spellset>'];
    
    for (let level = 0; level <= 9; level++) {
      const levelSpells = spells.filter(spell => spell.definition?.level === level);
      
      if (levelSpells.length > 0) {
        spellXml.push(`      <level${level}>`);
        
        levelSpells.forEach((spell, index) => {
          const spellName = StringSanitizer.sanitizeText(spell.definition?.name || '');
          spellXml.push(`        <spell${index + 1}>`);
          spellXml.push(`          <name type="string">${spellName}</name>`);
          spellXml.push(`          <prepared type="number">1</prepared>`);
          spellXml.push(`        </spell${index + 1}>`);
        });
        
        spellXml.push(`      </level${level}>`);
      }
    }
    
    spellXml.push('    </spellset>');
    return spellXml.join('\n');
  }

  private buildEquipment(character: any, options?: FormatOptions): string {
    const inventory = SafeAccess.get(character, 'inventory') || [];
    
    if (inventory.length === 0) {
      return '    <inventorylist />';
    }

    const equipmentXml = ['    <inventorylist>'];
    
    inventory.slice(0, 20).forEach((item, index) => { // Limit to prevent huge XML
      const itemName = StringSanitizer.sanitizeText(item.definition?.name || '');
      const quantity = item.quantity || 1;
      
      equipmentXml.push(`      <item${index + 1}>`);
      equipmentXml.push(`        <name type="string">${itemName}</name>`);
      equipmentXml.push(`        <count type="number">${quantity}</count>`);
      equipmentXml.push(`        <carried type="number">1</carried>`);
      equipmentXml.push(`      </item${index + 1}>`);
    });
    
    equipmentXml.push('    </inventorylist>');
    return equipmentXml.join('\n');
  }

  private buildFeatures(character: any, options?: FormatOptions): string {
    const features = SafeAccess.get(character, 'classFeatures') || [];
    const racialTraits = SafeAccess.get(character, 'race.racialTraits') || [];
    const allFeatures = [...features, ...racialTraits];
    
    if (allFeatures.length === 0) {
      return '    <featurelist />';
    }

    const featuresXml = ['    <featurelist>'];
    
    allFeatures.slice(0, 30).forEach((feature, index) => { // Limit features
      const featureName = StringSanitizer.sanitizeText(feature.definition?.name || feature.name || '');
      const description = StringSanitizer.sanitizeText(feature.definition?.description || feature.description || '');
      
      featuresXml.push(`      <feature${index + 1}>`);
      featuresXml.push(`        <name type="string">${featureName}</name>`);
      featuresXml.push(`        <text type="formattedtext">${description.slice(0, 500)}</text>`);
      featuresXml.push(`      </feature${index + 1}>`);
    });
    
    featuresXml.push('    </featurelist>');
    return featuresXml.join('\n');
  }

  async validateOutput(output: string): Promise<{isValid: boolean; errors?: string[]}> {
    try {
      const errors = [];

      if (!output || typeof output !== 'string') {
        errors.push('Output is empty or not a string');
        return { isValid: false, errors };
      }

      if (!output.includes('<?xml')) {
        errors.push('Missing XML declaration');
      }

      if (!output.includes('<root')) {
        errors.push('Missing root element');
      }

      if (!output.includes('<character>')) {
        errors.push('Missing character element');
      }

      if (!output.includes('<name')) {
        errors.push('Missing character name');
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['XML validation error: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  getDefaultOptions(): FormatOptions {
    return {
      includeDescription: true,
      includeNotes: true,
      spellFormat: 'individual',
      featureDetail: 'summary',
      imageHandling: 'reference'
    };
  }

  async getSampleOutput(): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<root version="4.1" dataversion="20210302">
  <character>
    <name type="string">Sample Character</name>
    <race type="string">Human</race>
    <classes type="string">Fighter 3</classes>
    <background type="string">Soldier</background>
    <alignment type="string">Lawful Good</alignment>
    <level type="number">3</level>
    <exp type="number">900</exp>
    <abilities>
      <strength>
        <score type="number">16</score>
        <bonus type="number">3</bonus>
        <text type="string">16 (+3)</text>
      </strength>
    </abilities>
    <hp>
      <total type="number">28</total>
      <current type="number">28</current>
    </hp>
    <ac type="number">12</ac>
    <speed type="number">30</speed>
    <profbonus type="number">2</profbonus>
  </character>
</root>`;
  }
}