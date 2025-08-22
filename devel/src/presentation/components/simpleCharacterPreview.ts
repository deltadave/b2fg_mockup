/**
 * Simple Character Preview Enhancement
 * 
 * Lightweight character preview with basic validation indicators
 * and simple missing data detection
 */

import Alpine from 'alpinejs';
import { AbilityScoreProcessor } from '@/domain/character/services/AbilityScoreProcessor';

export interface ValidationStatus {
  isValid: boolean;
  completeness: number;
  issues: string[];
  warnings: string[];
}

export interface SimpleCharacterPreviewData {
  characterData: any;
  xmlData: string | null;
  validationStatus: ValidationStatus;
  showValidation: boolean;
  
  // Methods
  init(): void;
  updateCharacterData(data: any): void;
  validateCharacter(data: any): ValidationStatus;
  getCompletenessColor(percentage: number): string;
  getValidationIcon(isValid: boolean): string;
  formatCharacterLevel(data: any): string;
  formatCharacterRace(data: any): string;
  formatCharacterClasses(data: any): string;
  extractXmlStat(xml: string, statName: string): string;
  extractXmlValue(xml: string, element: string, attribute: string): string;
}

// Simple character validation logic
function validateCharacterData(characterData: any): ValidationStatus {
  const issues: string[] = [];
  const warnings: string[] = [];
  let validChecks = 0;
  const totalChecks = 10;

  // Check basic information
  if (characterData.name) validChecks++;
  else issues.push('Character name is missing');

  if (characterData.race?.fullName) validChecks++;
  else issues.push('Character race is missing');

  if (characterData.classes && characterData.classes.length > 0) validChecks++;
  else issues.push('Character class is missing');

  // Check ability scores
  if (characterData.stats && Object.keys(characterData.stats).length >= 6) validChecks++;
  else issues.push('Ability scores are incomplete');

  // Check hit points
  if (characterData.hitPointsMax > 0) validChecks++;
  else warnings.push('Hit points may be incorrect');

  // Check proficiency bonus
  if (characterData.proficiencyBonus > 0) validChecks++;
  else warnings.push('Proficiency bonus may be missing');

  // Check armor class
  if (characterData.armorClass > 0) validChecks++;
  else warnings.push('Armor class calculation may be missing');

  // Check saving throws
  if (characterData.savingThrows) validChecks++;
  else warnings.push('Saving throw information may be incomplete');

  // Check skills
  if (characterData.skills && Object.keys(characterData.skills).length > 0) validChecks++;
  else warnings.push('Skill information may be incomplete');

  // Check inventory/equipment
  if (characterData.inventory && characterData.inventory.length > 0) validChecks++;
  else warnings.push('Equipment information may be incomplete');

  const completeness = Math.round((validChecks / totalChecks) * 100);
  const isValid = issues.length === 0 && completeness >= 70;

  return {
    isValid,
    completeness,
    issues,
    warnings
  };
}

// Alpine.js component for simple character preview
Alpine.data('simpleCharacterPreview', (): SimpleCharacterPreviewData => ({
  characterData: null,
  xmlData: null,
  validationStatus: {
    isValid: false,
    completeness: 0,
    issues: [],
    warnings: []
  },
  showValidation: true,

  init() {
    console.log('🔍 Simple Character Preview initialized');
    
    // Listen for character data updates
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail?.characterData) {
        this.updateCharacterData(event.detail.characterData);
        this.xmlData = event.detail.xml || null;
      }
    });
  },

  updateCharacterData(data: any) {
    this.characterData = data;
    this.validationStatus = this.validateCharacter(data);
    
    // Try to get XML from conversionResults store if not already set
    if (!this.xmlData && (window as any).Alpine) {
      const conversionResults = (window as any).Alpine.store('conversionResults');
      if (conversionResults?.xmlContent) {
        this.xmlData = conversionResults.xmlContent;
        console.log('📄 XML data retrieved from store:', this.xmlData.length + ' characters');
      }
    }
    
    console.log('📊 Character preview updated:', {
      name: data.name,
      completeness: this.validationStatus.completeness + '%',
      valid: this.validationStatus.isValid,
      hasXml: !!this.xmlData
    });
    
    // Debug: Log the actual ability score data structure
    console.log('🔍 Ability Score Data Structure:', {
      stats: data.stats,
      bonusStats: data.bonusStats,
      overrideStats: data.overrideStats,
      strStat: data.stats?.[0],
      strBonus: data.bonusStats?.[0],
      strOverride: data.overrideStats?.[0]
    });
    
    // Just log what we need - the calculated values that go to XML
    console.log('🎯 Using XML data source values:', {
      hp: this.getCalculatedHP(),
      ac: this.getCalculatedAC(),
      classes: this.getFormattedClasses()
    });
    
    // Try to use the same AbilityScoreProcessor that generates the XML
    try {
      const processedScores = AbilityScoreProcessor.processAbilityScoreBonuses(data);
      console.log('🎯 AbilityScoreProcessor Results (XML source):', processedScores);
      console.log('🎯 Strength from processor:', processedScores.totalScores.strength?.total);
    } catch (e) {
      console.log('Error with AbilityScoreProcessor:', e);
    }
  },

  validateCharacter(data: any): ValidationStatus {
    if (!data) {
      return {
        isValid: false,
        completeness: 0,
        issues: ['No character data available'],
        warnings: []
      };
    }

    return validateCharacterData(data);
  },

  getCompletenessColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 50) return 'text-orange-500';
    return 'text-red-500';
  },

  getValidationIcon(isValid: boolean): string {
    return isValid ? '✅' : '⚠️';
  },

  formatCharacterLevel(data: any): string {
    if (!data || !data.classes || !Array.isArray(data.classes)) return 'Level 1';
    
    const totalLevel = data.classes.reduce((total: number, cls: any) => {
      return total + (cls.level || 0);
    }, 0);
    
    return `Level ${totalLevel}`;
  },

  formatCharacterRace(data: any): string {
    if (!data || !data.race) return 'Unknown Race';
    
    const raceName = data.race.fullName || data.race.baseName || 'Unknown';
    if (data.race.subRaceName && data.race.subRaceName !== data.race.baseName) {
      return `${data.race.subRaceName} ${data.race.baseName}`;
    }
    
    return raceName;
  },

  formatCharacterClasses(data: any): string {
    if (!data || !data.classes || !Array.isArray(data.classes)) return 'No Class';
    
    if (data.classes.length === 1) {
      const cls = data.classes[0];
      const className = cls.definition?.name || 'Unknown Class';
      const subclass = cls.subclassDefinition?.name;
      return subclass ? `${className} (${subclass})` : className;
    } else {
      return data.classes.map((cls: any) => {
        const className = cls.definition?.name || 'Unknown';
        return `${className} ${cls.level}`;
      }).join(' / ');
    }
  },

  extractXmlStat(xml: string, statName: string): string {
    if (!xml) return '0';
    const regex = new RegExp(`<${statName}><score type="number">(\\d+)</score>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '0';
  },

  extractXmlValue(xml: string, element: string, attribute: string): string {
    if (!xml) return '0';
    const regex = new RegExp(`<${element}><${attribute} type="number">(\\d+)</${attribute}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '0';
  },

  getCalculatedStat(stat: any, index: number): number {
    if (!stat || !this.characterData) return 0;
    
    // Use the same AbilityScoreProcessor that generates the XML values
    try {
      const processedScores = AbilityScoreProcessor.processAbilityScoreBonuses(this.characterData);
      const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      const abilityName = abilityNames[index];
      
      if (abilityName && processedScores.totalScores[abilityName]) {
        return processedScores.totalScores[abilityName].total;
      }
    } catch (error) {
      console.error('Error using AbilityScoreProcessor:', error);
    }
    
    // Fallback to basic calculation if processor fails
    const baseStat = stat.value || 10;
    const bonusStat = this.characterData.bonusStats?.find((bonus: any) => bonus.id === stat.id);
    const bonusValue = bonusStat?.value || 0;
    
    return baseStat + bonusValue;
  },

  getCalculatedHP(): number {
    if (!this.characterData) return 0;
    
    // Calculate HP the same way as XML generation:
    // baseHitPoints + (Constitution modifier × total level)
    const baseHP = this.characterData.baseHitPoints || 0;
    const totalLevel = this.calculateTotalLevel();
    const constitutionModifier = this.getConstitutionModifier();
    
    return baseHP + (constitutionModifier * totalLevel);
  },

  calculateTotalLevel(): number {
    if (!this.characterData?.classes || !Array.isArray(this.characterData.classes)) {
      return 1;
    }
    return this.characterData.classes.reduce((total: number, cls: any) => total + (cls.level || 0), 0) || 1;
  },

  getConstitutionModifier(): number {
    if (!this.characterData) return 0;
    
    // Get Constitution score using the same AbilityScoreProcessor
    try {
      const processedScores = AbilityScoreProcessor.processAbilityScoreBonuses(this.characterData);
      const constitutionScore = processedScores.totalScores.constitution?.total || 10;
      return Math.floor((constitutionScore - 10) / 2);
    } catch (error) {
      console.error('Error calculating Constitution modifier:', error);
      return 0;
    }
  },

  getCalculatedAC(): number {
    if (!this.characterData) return 10;
    
    // Calculate AC the same way as XML generation should:
    // Check for Unarmored Defense (Barbarian): 10 + DEX mod + CON mod
    const hasUnarmoredDefense = this.characterData.classes?.some((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'barbarian'
    );
    
    if (hasUnarmoredDefense) {
      try {
        const processedScores = AbilityScoreProcessor.processAbilityScoreBonuses(this.characterData);
        const dexModifier = Math.floor((processedScores.totalScores.dexterity?.total - 10) / 2) || 0;
        const conModifier = Math.floor((processedScores.totalScores.constitution?.total - 10) / 2) || 0;
        return 10 + dexModifier + conModifier;
      } catch (error) {
        console.error('Error calculating Unarmored Defense AC:', error);
      }
    }
    
    // Fallback to character data AC
    return this.characterData.armorClass || 10;
  },

  getCalculatedSpeed(): number {
    if (!this.characterData) return 30;
    
    // Get speed from race data or bonuses
    const raceSpeed = this.characterData.race?.weightSpeeds?.normal?.walk || 30;
    
    // Check for speed bonuses from items/features
    let speedBonus = 0;
    if (this.characterData.modifiers?.bonus) {
      this.characterData.modifiers.bonus.forEach((modifier: any) => {
        if (modifier.subType === 'speed' && modifier.value) {
          speedBonus += modifier.value;
        }
      });
    }
    
    return raceSpeed + speedBonus;
  },

  getCalculatedProficiencyBonus(): number {
    if (!this.characterData) return 2;
    
    // Use the calculated proficiencyBonus from character data
    return this.characterData.proficiencyBonus || 2;
  },

  getFormattedClasses(): string {
    // Use the same logic as the facade's formatCharacterClasses method
    return this.formatCharacterClasses(this.characterData);
  }
}));

console.log('🔍 Simple Character Preview component registered');