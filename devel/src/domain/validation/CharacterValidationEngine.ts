/**
 * Character Validation Engine
 * 
 * Provides comprehensive validation rules and accuracy calculations for D&D 5e character data.
 * Validates conversion accuracy, identifies missing data, and provides detailed feedback
 * for the Character Preview system.
 */

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (data: any, sourceData?: any) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  severity: 'error' | 'warning' | 'info' | 'success';
  message: string;
  details?: string[];
  accuracy?: number; // 0-100 percentage
  missingData?: string[];
  suggestions?: string[];
}

export interface SectionValidation {
  sectionId: string;
  sectionName: string;
  overallAccuracy: number;
  status: 'success' | 'warning' | 'error';
  results: ValidationResult[];
  itemCount: {
    total: number;
    validated: number;
    missing: number;
    errored: number;
  };
}

export interface CharacterValidationReport {
  characterName: string;
  overallAccuracy: number;
  overallStatus: 'success' | 'warning' | 'error';
  timestamp: Date;
  sections: SectionValidation[];
  summary: {
    totalItems: number;
    validatedItems: number;
    missingItems: number;
    erroredItems: number;
  };
}

export class CharacterValidationEngine {
  private readonly validationRules: Map<string, ValidationRule[]>;
  
  constructor() {
    this.validationRules = new Map();
    this.initializeValidationRules();
  }

  /**
   * Validate complete character data and generate comprehensive report
   */
  async validateCharacter(
    characterData: any, 
    sourceData?: any
  ): Promise<CharacterValidationReport> {
    const startTime = performance.now();
    
    console.log('Starting character validation...', characterData?.name || 'Unknown');
    
    const sections: SectionValidation[] = [];
    let totalItems = 0;
    let validatedItems = 0;
    let missingItems = 0;
    let erroredItems = 0;

    // Validate each section
    const sectionConfigs = [
      { id: 'identity', name: 'Character Identity', data: this.extractIdentityData(characterData) },
      { id: 'abilities', name: 'Ability Scores', data: this.extractAbilitiesData(characterData) },
      { id: 'skills', name: 'Skills & Proficiencies', data: this.extractSkillsData(characterData) },
      { id: 'combat', name: 'Combat Statistics', data: this.extractCombatData(characterData) },
      { id: 'equipment', name: 'Equipment & Inventory', data: this.extractEquipmentData(characterData) },
      { id: 'spells', name: 'Spells & Magic', data: this.extractSpellsData(characterData) },
      { id: 'features', name: 'Features & Traits', data: this.extractFeaturesData(characterData) }
    ];

    for (const config of sectionConfigs) {
      const sectionValidation = await this.validateSection(
        config.id,
        config.name,
        config.data,
        sourceData
      );
      
      sections.push(sectionValidation);
      
      totalItems += sectionValidation.itemCount.total;
      validatedItems += sectionValidation.itemCount.validated;
      missingItems += sectionValidation.itemCount.missing;
      erroredItems += sectionValidation.itemCount.errored;
    }

    // Calculate overall accuracy
    const overallAccuracy = totalItems > 0 
      ? Math.round((validatedItems / totalItems) * 100)
      : 0;

    // Determine overall status
    let overallStatus: 'success' | 'warning' | 'error' = 'success';
    if (erroredItems > 0 || overallAccuracy < 70) {
      overallStatus = 'error';
    } else if (missingItems > 0 || overallAccuracy < 90) {
      overallStatus = 'warning';
    }

    const report: CharacterValidationReport = {
      characterName: characterData?.name || 'Unknown Character',
      overallAccuracy,
      overallStatus,
      timestamp: new Date(),
      sections,
      summary: {
        totalItems,
        validatedItems,
        missingItems,
        erroredItems
      }
    };

    const duration = performance.now() - startTime;
    console.log(`Character validation completed in ${duration.toFixed(2)}ms`, {
      accuracy: overallAccuracy,
      status: overallStatus
    });

    return report;
  }

  /**
   * Validate individual character section
   */
  private async validateSection(
    sectionId: string,
    sectionName: string,
    sectionData: any,
    sourceData?: any
  ): Promise<SectionValidation> {
    const rules = this.validationRules.get(sectionId) || [];
    const results: ValidationResult[] = [];
    
    let total = 0;
    let validated = 0;
    let missing = 0;
    let errored = 0;

    // Run all rules for this section
    for (const rule of rules) {
      try {
        const result = rule.validate(sectionData, sourceData);
        results.push(result);
        
        total++;
        
        if (result.severity === 'error') {
          errored++;
        } else if (result.severity === 'warning' && result.missingData?.length) {
          missing++;
        } else if (result.valid) {
          validated++;
        }
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error);
        results.push({
          valid: false,
          severity: 'error',
          message: `Validation rule failed: ${rule.name}`,
          details: [error instanceof Error ? error.message : 'Unknown error']
        });
        errored++;
        total++;
      }
    }

    // Calculate section accuracy
    const accuracyValues = results
      .filter(r => r.accuracy !== undefined)
      .map(r => r.accuracy!);
    
    const overallAccuracy = accuracyValues.length > 0
      ? Math.round(accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length)
      : (validated / Math.max(total, 1)) * 100;

    // Determine section status
    let status: 'success' | 'warning' | 'error' = 'success';
    if (errored > 0) {
      status = 'error';
    } else if (missing > 0 || overallAccuracy < 90) {
      status = 'warning';
    }

    return {
      sectionId,
      sectionName,
      overallAccuracy,
      status,
      results,
      itemCount: {
        total,
        validated,
        missing,
        errored
      }
    };
  }

  /**
   * Initialize comprehensive validation rules for all character sections
   */
  private initializeValidationRules(): void {
    // Character Identity Rules
    this.validationRules.set('identity', [
      {
        id: 'name-present',
        name: 'Character Name',
        description: 'Character must have a valid name',
        severity: 'error',
        validate: (data) => ({
          valid: !!(data?.name && data.name.trim().length > 0),
          severity: data?.name ? 'success' : 'error',
          message: data?.name ? `Name: "${data.name}"` : 'Character name is missing',
          accuracy: data?.name ? 100 : 0
        })
      },
      {
        id: 'race-present',
        name: 'Character Race',
        description: 'Character must have a valid race',
        severity: 'warning',
        validate: (data) => {
          const race = data?.race?.baseName || data?.race?.name;
          const subrace = data?.race?.subraceShortName;
          
          if (!race) {
            return {
              valid: false,
              severity: 'warning',
              message: 'Race information is missing',
              accuracy: 0,
              missingData: ['race']
            };
          }
          
          return {
            valid: true,
            severity: 'success',
            message: subrace ? `${race} (${subrace})` : race,
            accuracy: 100
          };
        }
      },
      {
        id: 'classes-present',
        name: 'Character Classes',
        description: 'Character must have at least one class',
        severity: 'error',
        validate: (data) => {
          const classes = data?.classes || [];
          
          if (!Array.isArray(classes) || classes.length === 0) {
            return {
              valid: false,
              severity: 'error',
              message: 'No character classes found',
              accuracy: 0,
              missingData: ['classes']
            };
          }

          const classNames = classes
            .map(c => {
              const name = c?.definition?.name || c?.name;
              const level = c?.level;
              const subclass = c?.subclass?.definition?.name;
              
              let result = name;
              if (level) result += ` (${level})`;
              if (subclass) result += ` - ${subclass}`;
              
              return result;
            })
            .filter(Boolean);

          return {
            valid: classNames.length > 0,
            severity: classNames.length > 0 ? 'success' : 'warning',
            message: classNames.length > 0 
              ? `Classes: ${classNames.join(', ')}`
              : 'Class details incomplete',
            accuracy: (classNames.length / classes.length) * 100
          };
        }
      },
      {
        id: 'level-calculation',
        name: 'Total Level',
        description: 'Character level should be calculated correctly',
        severity: 'info',
        validate: (data) => {
          const classes = data?.classes || [];
          const totalLevel = classes.reduce((sum: number, c: any) => sum + (c?.level || 0), 0);
          
          return {
            valid: totalLevel > 0,
            severity: totalLevel > 0 ? 'success' : 'warning',
            message: `Total Level: ${totalLevel}`,
            accuracy: totalLevel > 0 ? 100 : 0
          };
        }
      }
    ]);

    // Ability Scores Rules
    this.validationRules.set('abilities', [
      {
        id: 'six-abilities',
        name: 'Six Core Abilities',
        description: 'All six D&D abilities must be present',
        severity: 'error',
        validate: (data) => {
          const requiredAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
          const abilities = data?.abilities || {};
          
          const presentAbilities = requiredAbilities.filter(ability => 
            abilities[ability] && typeof abilities[ability].value === 'number'
          );
          
          const missingAbilities = requiredAbilities.filter(ability => 
            !abilities[ability] || typeof abilities[ability].value !== 'number'
          );

          const accuracy = (presentAbilities.length / requiredAbilities.length) * 100;

          return {
            valid: presentAbilities.length === requiredAbilities.length,
            severity: missingAbilities.length === 0 ? 'success' : 'error',
            message: missingAbilities.length === 0 
              ? 'All ability scores present'
              : `Missing abilities: ${missingAbilities.join(', ')}`,
            accuracy,
            missingData: missingAbilities
          };
        }
      },
      {
        id: 'ability-modifiers',
        name: 'Ability Modifiers',
        description: 'Ability modifiers should be calculated correctly',
        severity: 'warning',
        validate: (data) => {
          const abilities = data?.abilities || {};
          let correct = 0;
          let total = 0;
          const errors: string[] = [];

          Object.entries(abilities).forEach(([name, abilityData]: [string, any]) => {
            if (abilityData && typeof abilityData.value === 'number') {
              total++;
              const expectedModifier = Math.floor((abilityData.value - 10) / 2);
              const actualModifier = abilityData.modifier;
              
              if (actualModifier === expectedModifier) {
                correct++;
              } else {
                errors.push(`${name}: expected ${expectedModifier}, got ${actualModifier}`);
              }
            }
          });

          const accuracy = total > 0 ? (correct / total) * 100 : 0;

          return {
            valid: errors.length === 0,
            severity: errors.length === 0 ? 'success' : 'warning',
            message: errors.length === 0 
              ? 'All ability modifiers correct'
              : `Modifier errors: ${errors.length}`,
            accuracy,
            details: errors
          };
        }
      }
    ]);

    // Skills & Proficiencies Rules
    this.validationRules.set('skills', [
      {
        id: 'skill-list',
        name: 'Skill Proficiencies',
        description: 'Skills should be properly identified',
        severity: 'info',
        validate: (data) => {
          const skills = data?.skills || [];
          const proficientSkills = skills.filter((s: any) => s?.proficient);
          const expertiseSkills = skills.filter((s: any) => s?.expertise);

          return {
            valid: true,
            severity: 'success',
            message: `${skills.length} skills (${proficientSkills.length} proficient, ${expertiseSkills.length} expertise)`,
            accuracy: skills.length > 0 ? 100 : 0
          };
        }
      }
    ]);

    // Combat Statistics Rules
    this.validationRules.set('combat', [
      {
        id: 'armor-class',
        name: 'Armor Class',
        description: 'Armor Class should be calculated',
        severity: 'warning',
        validate: (data) => {
          const ac = data?.armorClass || data?.ac;
          
          return {
            valid: typeof ac === 'number' && ac > 0,
            severity: typeof ac === 'number' && ac > 0 ? 'success' : 'warning',
            message: typeof ac === 'number' ? `AC: ${ac}` : 'Armor Class not calculated',
            accuracy: typeof ac === 'number' && ac > 0 ? 100 : 0,
            missingData: typeof ac !== 'number' ? ['armorClass'] : undefined
          };
        }
      },
      {
        id: 'hit-points',
        name: 'Hit Points',
        description: 'Hit points should be calculated',
        severity: 'warning',
        validate: (data) => {
          const hp = data?.hitPoints || data?.hp || data?.maxHitPoints;
          
          return {
            valid: typeof hp === 'number' && hp > 0,
            severity: typeof hp === 'number' && hp > 0 ? 'success' : 'warning',
            message: typeof hp === 'number' ? `HP: ${hp}` : 'Hit Points not calculated',
            accuracy: typeof hp === 'number' && hp > 0 ? 100 : 0,
            missingData: typeof hp !== 'number' ? ['hitPoints'] : undefined
          };
        }
      }
    ]);

    // Equipment Rules
    this.validationRules.set('equipment', [
      {
        id: 'equipment-count',
        name: 'Equipment Items',
        description: 'Equipment should be identified and categorized',
        severity: 'info',
        validate: (data) => {
          const equipment = data?.equipment || [];
          let totalItems = 0;
          
          if (Array.isArray(equipment)) {
            totalItems = equipment.reduce((sum: number, category: any) => 
              sum + (category?.items?.length || 0), 0
            );
          }

          return {
            valid: true,
            severity: 'success',
            message: `${totalItems} equipment items in ${equipment.length} categories`,
            accuracy: equipment.length > 0 ? 100 : 0
          };
        }
      }
    ]);

    // Spells Rules
    this.validationRules.set('spells', [
      {
        id: 'spell-slots',
        name: 'Spell Slots',
        description: 'Spell slots should be calculated for casters',
        severity: 'info',
        validate: (data) => {
          const spells = data?.spells;
          
          if (!spells || !spells.spellSlots) {
            return {
              valid: true,
              severity: 'info',
              message: 'Non-spellcaster (no spell slots needed)',
              accuracy: 100
            };
          }

          const slotLevels = Object.keys(spells.spellSlots).filter(level => 
            spells.spellSlots[level] > 0
          );

          return {
            valid: slotLevels.length > 0,
            severity: slotLevels.length > 0 ? 'success' : 'warning',
            message: slotLevels.length > 0 
              ? `Spell slots: levels ${slotLevels.join(', ')}`
              : 'Spell slots not calculated',
            accuracy: slotLevels.length > 0 ? 100 : 0
          };
        }
      },
      {
        id: 'known-spells',
        name: 'Known Spells',
        description: 'Known spells should be listed for casters',
        severity: 'info',
        validate: (data) => {
          const spells = data?.spells;
          
          if (!spells || !spells.knownSpells) {
            return {
              valid: true,
              severity: 'info',
              message: 'No spells or non-spellcaster',
              accuracy: 100
            };
          }

          const knownSpells = spells.knownSpells || [];

          return {
            valid: true,
            severity: 'success',
            message: `${knownSpells.length} known spells`,
            accuracy: 100
          };
        }
      }
    ]);

    // Features & Traits Rules
    this.validationRules.set('features', [
      {
        id: 'feature-count',
        name: 'Character Features',
        description: 'Features and traits should be identified',
        severity: 'info',
        validate: (data) => {
          const features = data?.features || [];
          const classFeatures = features.filter((f: any) => f?.source && !f.source.includes('Race'));
          const racialTraits = features.filter((f: any) => f?.source && f.source.includes('Race'));

          return {
            valid: true,
            severity: 'success',
            message: `${features.length} features (${classFeatures.length} class, ${racialTraits.length} racial)`,
            accuracy: features.length > 0 ? 100 : 0
          };
        }
      }
    ]);
  }

  /**
   * Data extraction methods for each section
   */
  private extractIdentityData(characterData: any): any {
    return {
      name: characterData?.name,
      race: characterData?.race,
      classes: characterData?.classes,
      level: characterData?.level
    };
  }

  private extractAbilitiesData(characterData: any): any {
    return {
      abilities: characterData?.abilities
    };
  }

  private extractSkillsData(characterData: any): any {
    return {
      skills: characterData?.skills
    };
  }

  private extractCombatData(characterData: any): any {
    return {
      armorClass: characterData?.armorClass || characterData?.ac,
      hitPoints: characterData?.hitPoints || characterData?.hp || characterData?.maxHitPoints,
      speed: characterData?.speed,
      proficiencyBonus: characterData?.proficiencyBonus
    };
  }

  private extractEquipmentData(characterData: any): any {
    return {
      equipment: characterData?.equipment
    };
  }

  private extractSpellsData(characterData: any): any {
    return {
      spells: characterData?.spells
    };
  }

  private extractFeaturesData(characterData: any): any {
    return {
      features: characterData?.features
    };
  }

  /**
   * Real-time validation for individual sections during conversion
   */
  async validateSectionRealtime(
    sectionId: string, 
    sectionData: any, 
    sourceData?: any
  ): Promise<SectionValidation> {
    return this.validateSection(sectionId, sectionId, sectionData, sourceData);
  }

  /**
   * Get validation rules for a specific section
   */
  getValidationRules(sectionId: string): ValidationRule[] {
    return this.validationRules.get(sectionId) || [];
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(sectionId: string, rule: ValidationRule): void {
    if (!this.validationRules.has(sectionId)) {
      this.validationRules.set(sectionId, []);
    }
    this.validationRules.get(sectionId)!.push(rule);
  }
}

// Export singleton instance
export const characterValidationEngine = new CharacterValidationEngine();