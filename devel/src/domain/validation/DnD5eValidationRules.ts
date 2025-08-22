/**
 * D&D 5e Comprehensive Validation Rules
 * 
 * Contains detailed validation rules for all aspects of D&D 5e character data,
 * ensuring accurate conversion from D&D Beyond to Fantasy Grounds format.
 */

import { ValidationRule, ValidationResult } from './CharacterValidationEngine';

/**
 * D&D 5e Core Constants for validation
 */
export const DND5E_CONSTANTS = {
  ABILITIES: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
  
  SKILLS: [
    'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception', 'history',
    'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
    'performance', 'persuasion', 'religion', 'sleightOfHand', 'stealth', 'survival'
  ],
  
  SKILL_ABILITY_MAP: {
    'acrobatics': 'dexterity',
    'animalHandling': 'wisdom',
    'arcana': 'intelligence',
    'athletics': 'strength',
    'deception': 'charisma',
    'history': 'intelligence',
    'insight': 'wisdom',
    'intimidation': 'charisma',
    'investigation': 'intelligence',
    'medicine': 'wisdom',
    'nature': 'intelligence',
    'perception': 'wisdom',
    'performance': 'charisma',
    'persuasion': 'charisma',
    'religion': 'intelligence',
    'sleightOfHand': 'dexterity',
    'stealth': 'dexterity',
    'survival': 'wisdom'
  },
  
  ARMOR_TYPES: ['none', 'light', 'medium', 'heavy', 'shield'],
  WEAPON_PROPERTIES: ['finesse', 'light', 'heavy', 'reach', 'thrown', 'versatile', 'ammunition'],
  
  SPELL_SCHOOLS: [
    'abjuration', 'conjuration', 'divination', 'enchantment',
    'evocation', 'illusion', 'necromancy', 'transmutation'
  ],
  
  DAMAGE_TYPES: [
    'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
    'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'
  ],
  
  CLASS_FEATURES: {
    'fighter': ['fightingStyle', 'secondWind', 'actionSurge', 'extraAttack'],
    'wizard': ['spellcasting', 'arcaneRecovery', 'arcaneTradition'],
    'rogue': ['expertisе', 'sneakAttack', 'thievesСant', 'cunningAction'],
    'cleric': ['spellcasting', 'divineIntervention', 'channelDivinity'],
    'ranger': ['favoredEnemy', 'naturalExplorer', 'spellcasting'],
    'barbarian': ['rage', 'unarmoredDefense', 'recklessAttack'],
    'bard': ['spellcasting', 'bardicInspiration', 'jackOfAllTrades'],
    'druid': ['spellcasting', 'wildShape', 'druidcraft'],
    'monk': ['unarmoredDefense', 'martialArts', 'ki'],
    'paladin': ['spellcasting', 'layOnHands', 'divineSmite'],
    'sorcerer': ['spellcasting', 'sorcerousOrigin', 'metamagic'],
    'warlock': ['pactMagic', 'eldritchInvocations', 'otherworldlyPatron']
  }
};

/**
 * Extended Character Identity Validation Rules
 */
export const identityValidationRules: ValidationRule[] = [
  {
    id: 'character-name-format',
    name: 'Character Name Format',
    description: 'Character name should be properly formatted',
    severity: 'warning',
    validate: (data) => {
      const name = data?.name;
      
      if (!name) {
        return {
          valid: false,
          severity: 'error',
          message: 'Character name is missing',
          accuracy: 0,
          missingData: ['name']
        };
      }
      
      const hasSpecialChars = /[<>{}[\]\\|`~!@#$%^&*()+=;:"']/.test(name);
      const tooLong = name.length > 50;
      const tooShort = name.length < 2;
      
      if (hasSpecialChars) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Character name contains special characters',
          accuracy: 75,
          suggestions: ['Remove special characters from character name']
        };
      }
      
      if (tooLong) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Character name is too long (>50 characters)',
          accuracy: 80,
          suggestions: ['Shorten character name to under 50 characters']
        };
      }
      
      if (tooShort) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Character name is too short (<2 characters)',
          accuracy: 60,
          suggestions: ['Provide a longer character name']
        };
      }
      
      return {
        valid: true,
        severity: 'success',
        message: `Valid character name: "${name}"`,
        accuracy: 100
      };
    }
  },
  
  {
    id: 'race-subrace-validation',
    name: 'Race and Subrace Validation',
    description: 'Validate race and subrace combinations',
    severity: 'warning',
    validate: (data) => {
      const race = data?.race;
      
      if (!race) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Race information missing',
          accuracy: 0,
          missingData: ['race']
        };
      }
      
      const baseName = race.baseName || race.name;
      const subrace = race.subraceShortName || race.subraceName;
      
      // Validate known race/subrace combinations
      const validCombinations: Record<string, string[]> = {
        'elf': ['high', 'wood', 'dark', 'eladrin', 'sea', 'shadar-kai'],
        'dwarf': ['hill', 'mountain', 'duergar'],
        'halfling': ['lightfoot', 'stout', 'ghostwise'],
        'gnome': ['forest', 'rock', 'deep'],
        'dragonborn': ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'],
        'tiefling': ['asmodeus', 'baalzebul', 'dispater', 'fierna', 'glasya', 'levistus', 'mammon', 'mephistopheles', 'zariel']
      };
      
      const raceKey = baseName?.toLowerCase();
      const validSubraces = validCombinations[raceKey];
      
      if (validSubraces && subrace) {
        const subraceKey = subrace.toLowerCase();
        const isValidCombination = validSubraces.some(valid => 
          subraceKey.includes(valid) || valid.includes(subraceKey)
        );
        
        if (!isValidCombination) {
          return {
            valid: false,
            severity: 'warning',
            message: `Unusual ${baseName}/${subrace} combination`,
            accuracy: 85,
            suggestions: [`Verify ${baseName} subrace: ${subrace}`]
          };
        }
      }
      
      return {
        valid: true,
        severity: 'success',
        message: subrace ? `${baseName} (${subrace})` : baseName,
        accuracy: 100
      };
    }
  },
  
  {
    id: 'multiclass-level-validation',
    name: 'Multiclass Level Validation',
    description: 'Validate multiclass level distribution',
    severity: 'info',
    validate: (data) => {
      const classes = data?.classes || [];
      
      if (!Array.isArray(classes) || classes.length === 0) {
        return {
          valid: false,
          severity: 'error',
          message: 'No classes found',
          accuracy: 0,
          missingData: ['classes']
        };
      }
      
      const totalLevel = classes.reduce((sum: number, c: any) => sum + (c?.level || 0), 0);
      const classCount = classes.length;
      
      // Single class validation
      if (classCount === 1) {
        const singleClass = classes[0];
        const className = singleClass?.definition?.name || singleClass?.name || 'Unknown';
        const level = singleClass?.level || 0;
        
        if (level < 1 || level > 20) {
          return {
            valid: false,
            severity: 'error',
            message: `Invalid ${className} level: ${level}`,
            accuracy: 50,
            suggestions: ['Character level must be between 1 and 20']
          };
        }
        
        return {
          valid: true,
          severity: 'success',
          message: `${className} Level ${level}`,
          accuracy: 100
        };
      }
      
      // Multiclass validation
      if (totalLevel > 20) {
        return {
          valid: false,
          severity: 'error',
          message: `Total level ${totalLevel} exceeds maximum of 20`,
          accuracy: 60,
          suggestions: ['Character total level cannot exceed 20']
        };
      }
      
      // Check for minimum multiclass levels
      const invalidClasses = classes.filter((c: any) => (c?.level || 0) < 1);
      if (invalidClasses.length > 0) {
        return {
          valid: false,
          severity: 'error',
          message: `${invalidClasses.length} classes with invalid levels`,
          accuracy: 70,
          suggestions: ['All multiclass levels must be at least 1']
        };
      }
      
      const classNames = classes
        .map((c: any) => {
          const name = c?.definition?.name || c?.name || 'Unknown';
          const level = c?.level || 0;
          const subclass = c?.subclass?.definition?.name;
          return subclass ? `${name} ${level} (${subclass})` : `${name} ${level}`;
        })
        .join(', ');
      
      return {
        valid: true,
        severity: 'success',
        message: `Multiclass: ${classNames} (Total ${totalLevel})`,
        accuracy: 100
      };
    }
  }
];

/**
 * Extended Ability Score Validation Rules
 */
export const abilityValidationRules: ValidationRule[] = [
  {
    id: 'ability-score-ranges',
    name: 'Ability Score Ranges',
    description: 'Ability scores should be within valid D&D ranges',
    severity: 'warning',
    validate: (data) => {
      const abilities = data?.abilities || {};
      let validCount = 0;
      let totalCount = 0;
      const issues: string[] = [];
      
      DND5E_CONSTANTS.ABILITIES.forEach(abilityName => {
        const ability = abilities[abilityName];
        totalCount++;
        
        if (!ability || typeof ability.value !== 'number') {
          issues.push(`${abilityName}: missing or invalid`);
          return;
        }
        
        const score = ability.value;
        
        // Check for realistic ability scores (3-20 for most characters, up to 30 for epic)
        if (score < 1 || score > 30) {
          issues.push(`${abilityName}: ${score} (outside valid range 1-30)`);
        } else if (score < 3 || score > 20) {
          issues.push(`${abilityName}: ${score} (unusual range, should typically be 3-20)`);
          validCount += 0.8; // Partial credit
        } else {
          validCount++;
        }
      });
      
      const accuracy = totalCount > 0 ? (validCount / totalCount) * 100 : 0;
      
      return {
        valid: issues.length === 0,
        severity: issues.length === 0 ? 'success' : 'warning',
        message: issues.length === 0 
          ? 'All ability scores within valid ranges'
          : `${issues.length} ability score issues`,
        accuracy,
        details: issues,
        suggestions: issues.length > 0 ? ['Review ability scores for unusual values'] : undefined
      };
    }
  },
  
  {
    id: 'ability-modifier-calculation',
    name: 'Ability Modifier Accuracy',
    description: 'Verify ability modifiers are calculated correctly',
    severity: 'error',
    validate: (data) => {
      const abilities = data?.abilities || {};
      let correctCount = 0;
      let totalCount = 0;
      const errors: string[] = [];
      
      Object.entries(abilities).forEach(([name, abilityData]: [string, any]) => {
        if (abilityData && typeof abilityData.value === 'number') {
          totalCount++;
          
          const score = abilityData.value;
          const expectedModifier = Math.floor((score - 10) / 2);
          const actualModifier = abilityData.modifier;
          
          if (actualModifier === expectedModifier) {
            correctCount++;
          } else {
            errors.push(`${name}: expected ${expectedModifier}, got ${actualModifier || 'undefined'}`);
          }
        }
      });
      
      const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
      
      return {
        valid: errors.length === 0,
        severity: errors.length === 0 ? 'success' : 'error',
        message: errors.length === 0 
          ? 'All ability modifiers calculated correctly'
          : `${errors.length} modifier calculation errors`,
        accuracy,
        details: errors,
        suggestions: errors.length > 0 ? ['Recalculate ability modifiers using formula: floor((score - 10) / 2)'] : undefined
      };
    }
  },
  
  {
    id: 'racial-ability-bonuses',
    name: 'Racial Ability Score Bonuses',
    description: 'Validate racial ability score improvements are applied',
    severity: 'info',
    validate: (data) => {
      const race = data?.race;
      const abilities = data?.abilities || {};
      
      if (!race) {
        return {
          valid: true,
          severity: 'info',
          message: 'No race data to validate bonuses',
          accuracy: 100
        };
      }
      
      // This is a complex validation that would require race bonus data
      // For now, we'll do a basic check for reasonableness
      const abilityScores = Object.values(abilities)
        .map((a: any) => a?.value || 0)
        .filter(score => typeof score === 'number');
      
      const averageScore = abilityScores.reduce((sum, score) => sum + score, 0) / abilityScores.length;
      const highScores = abilityScores.filter(score => score >= 14).length;
      
      // Basic heuristics for point buy vs. rolled stats
      let assessment = '';
      let accuracy = 100;
      
      if (averageScore < 8) {
        assessment = 'Unusually low ability scores';
        accuracy = 70;
      } else if (averageScore > 16) {
        assessment = 'Unusually high ability scores';
        accuracy = 90;
      } else if (highScores >= 4) {
        assessment = 'Many high ability scores (possible rolled stats)';
        accuracy = 95;
      } else {
        assessment = 'Ability scores appear reasonable';
        accuracy = 100;
      }
      
      return {
        valid: true,
        severity: 'info',
        message: assessment,
        accuracy,
        details: [`Average score: ${averageScore.toFixed(1)}`, `High scores (14+): ${highScores}`]
      };
    }
  }
];

/**
 * Skills and Proficiencies Validation Rules
 */
export const skillsValidationRules: ValidationRule[] = [
  {
    id: 'skill-proficiency-validation',
    name: 'Skill Proficiency Validation',
    description: 'Validate skill proficiencies and bonuses',
    severity: 'warning',
    validate: (data) => {
      const skills = data?.skills || [];
      const abilities = data?.abilities || {};
      const level = data?.level || 1;
      
      if (!Array.isArray(skills)) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Skills data is not in expected format',
          accuracy: 0,
          missingData: ['skills']
        };
      }
      
      if (skills.length === 0) {
        return {
          valid: false,
          severity: 'info',
          message: 'No skill proficiencies found',
          accuracy: 50,
          suggestions: ['Character may have skill proficiencies that were not detected']
        };
      }
      
      let validCount = 0;
      let totalCount = skills.length;
      const issues: string[] = [];
      const proficiencyBonus = Math.ceil(level / 4) + 1;
      
      skills.forEach((skill: any) => {
        const skillName = skill.name;
        const abilityName = skill.ability;
        const isProficient = skill.proficient;
        const hasExpertise = skill.expertise;
        
        // Check if skill has valid ability mapping
        if (!abilityName || !abilities[abilityName]) {
          issues.push(`${skillName}: missing or invalid ability (${abilityName})`);
          return;
        }
        
        const abilityModifier = abilities[abilityName].modifier || 0;
        let expectedBonus = abilityModifier;
        
        if (isProficient) {
          expectedBonus += proficiencyBonus;
        }
        
        if (hasExpertise) {
          expectedBonus += proficiencyBonus; // Double proficiency
        }
        
        // Note: We don't have the actual skill bonus in the data to compare
        // This validation is more about structure than calculation
        validCount++;
      });
      
      const proficientCount = skills.filter((s: any) => s.proficient).length;
      const expertiseCount = skills.filter((s: any) => s.expertise).length;
      
      const accuracy = totalCount > 0 ? (validCount / totalCount) * 100 : 0;
      
      return {
        valid: issues.length === 0,
        severity: issues.length === 0 ? 'success' : 'warning',
        message: `${skills.length} skills (${proficientCount} proficient, ${expertiseCount} expertise)`,
        accuracy,
        details: issues.length > 0 ? issues : [
          `Proficiency bonus: +${proficiencyBonus}`,
          `Proficient skills: ${proficientCount}`,
          `Expertise skills: ${expertiseCount}`
        ]
      };
    }
  },
  
  {
    id: 'class-skill-proficiencies',
    name: 'Class Skill Proficiencies',
    description: 'Validate class-based skill proficiency limits',
    severity: 'info',
    validate: (data) => {
      const classes = data?.classes || [];
      const skills = data?.skills || [];
      
      if (classes.length === 0 || skills.length === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'Insufficient data to validate class skill limits',
          accuracy: 100
        };
      }
      
      const proficientSkills = skills.filter((s: any) => s.proficient);
      
      // Basic validation - most classes get 2-4 skill proficiencies
      // This is a simplified check
      let expectedRange = [2, 4];
      
      // Adjust for known classes with different skill counts
      const primaryClass = classes[0];
      const className = primaryClass?.definition?.name?.toLowerCase() || '';
      
      switch (className) {
        case 'rogue':
          expectedRange = [4, 6]; // Rogues get more skills
          break;
        case 'bard':
          expectedRange = [3, 6]; // Bards get more skills
          break;
        case 'ranger':
          expectedRange = [3, 5]; // Rangers get decent skills
          break;
        case 'barbarian':
        case 'fighter':
        case 'sorcerer':
        case 'warlock':
          expectedRange = [2, 3]; // Fewer skills
          break;
      }
      
      const skillCount = proficientSkills.length;
      const withinRange = skillCount >= expectedRange[0] && skillCount <= expectedRange[1];
      
      return {
        valid: true, // This is informational, not a hard validation
        severity: 'info',
        message: withinRange 
          ? `Skill count (${skillCount}) matches class expectations`
          : `Skill count (${skillCount}) outside typical range ${expectedRange[0]}-${expectedRange[1]} for ${className}`,
        accuracy: withinRange ? 100 : 90,
        details: [`Primary class: ${className}`, `Proficient skills: ${skillCount}`]
      };
    }
  }
];

/**
 * Combat Statistics Validation Rules
 */
export const combatValidationRules: ValidationRule[] = [
  {
    id: 'armor-class-calculation',
    name: 'Armor Class Calculation',
    description: 'Validate armor class calculation',
    severity: 'warning',
    validate: (data) => {
      const ac = data?.armorClass || data?.ac;
      const abilities = data?.abilities || {};
      
      if (typeof ac !== 'number' || ac <= 0) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Armor Class not calculated or invalid',
          accuracy: 0,
          missingData: ['armorClass'],
          suggestions: ['Calculate Armor Class based on armor and Dex modifier']
        };
      }
      
      const dexModifier = abilities.dexterity?.modifier || 0;
      
      // Basic AC validation (10 + Dex modifier is minimum for unarmored)
      const baseAC = 10 + dexModifier;
      
      if (ac < Math.max(1, baseAC - 2)) { // Allow some flexibility
        return {
          valid: false,
          severity: 'warning',
          message: `AC ${ac} seems too low (expected minimum ~${baseAC})`,
          accuracy: 70,
          suggestions: ['Verify armor and Dex modifier calculations']
        };
      }
      
      if (ac > 25) { // Very high AC should be flagged
        return {
          valid: false,
          severity: 'warning',
          message: `AC ${ac} is unusually high`,
          accuracy: 80,
          suggestions: ['Verify magical bonuses and armor calculations']
        };
      }
      
      return {
        valid: true,
        severity: 'success',
        message: `AC: ${ac}`,
        accuracy: 100
      };
    }
  },
  
  {
    id: 'hit-points-calculation',
    name: 'Hit Points Calculation',
    description: 'Validate hit point calculation',
    severity: 'warning',
    validate: (data) => {
      const hp = data?.hitPoints || data?.hp || data?.maxHitPoints;
      const classes = data?.classes || [];
      const abilities = data?.abilities || {};
      const conModifier = abilities.constitution?.modifier || 0;
      
      if (typeof hp !== 'number' || hp <= 0) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Hit Points not calculated or invalid',
          accuracy: 0,
          missingData: ['hitPoints'],
          suggestions: ['Calculate Hit Points based on class HD and Con modifier']
        };
      }
      
      if (classes.length === 0) {
        return {
          valid: true,
          severity: 'info',
          message: `HP: ${hp} (cannot validate without class data)`,
          accuracy: 90
        };
      }
      
      // Calculate rough HP range based on classes
      const totalLevel = classes.reduce((sum: number, c: any) => sum + (c?.level || 0), 0);
      
      // Estimate HP range (using average HD values)
      const minHP = Math.max(1, totalLevel + (conModifier * totalLevel));
      const maxHP = totalLevel * 12 + (conModifier * totalLevel); // Assuming d12 HD for max
      
      if (hp < minHP * 0.5) {
        return {
          valid: false,
          severity: 'warning',
          message: `HP ${hp} seems too low for level ${totalLevel}`,
          accuracy: 70,
          suggestions: ['Verify hit die rolls and Constitution modifier']
        };
      }
      
      if (hp > maxHP * 1.2) {
        return {
          valid: false,
          severity: 'warning',
          message: `HP ${hp} seems high for level ${totalLevel}`,
          accuracy: 80,
          suggestions: ['Verify bonus HP sources (items, feats, etc.)']
        };
      }
      
      return {
        valid: true,
        severity: 'success',
        message: `HP: ${hp}`,
        accuracy: 100,
        details: [`Estimated range: ${Math.round(minHP)}-${Math.round(maxHP)}`]
      };
    }
  },
  
  {
    id: 'proficiency-bonus',
    name: 'Proficiency Bonus',
    description: 'Validate proficiency bonus for character level',
    severity: 'error',
    validate: (data) => {
      const proficiencyBonus = data?.proficiencyBonus;
      const classes = data?.classes || [];
      const totalLevel = classes.reduce((sum: number, c: any) => sum + (c?.level || 0), 0);
      
      if (totalLevel === 0) {
        return {
          valid: false,
          severity: 'error',
          message: 'Cannot validate proficiency bonus without character level',
          accuracy: 0,
          missingData: ['level']
        };
      }
      
      const expectedProficiencyBonus = Math.ceil(totalLevel / 4) + 1;
      
      if (typeof proficiencyBonus !== 'number') {
        return {
          valid: false,
          severity: 'warning',
          message: 'Proficiency bonus not specified',
          accuracy: 50,
          suggestions: [`Proficiency bonus should be +${expectedProficiencyBonus} for level ${totalLevel}`]
        };
      }
      
      if (proficiencyBonus !== expectedProficiencyBonus) {
        return {
          valid: false,
          severity: 'error',
          message: `Proficiency bonus +${proficiencyBonus} incorrect for level ${totalLevel}`,
          accuracy: 60,
          suggestions: [`Should be +${expectedProficiencyBonus} for level ${totalLevel}`]
        };
      }
      
      return {
        valid: true,
        severity: 'success',
        message: `Proficiency bonus: +${proficiencyBonus} (Level ${totalLevel})`,
        accuracy: 100
      };
    }
  }
];

/**
 * Equipment Validation Rules
 */
export const equipmentValidationRules: ValidationRule[] = [
  {
    id: 'equipment-structure',
    name: 'Equipment Data Structure',
    description: 'Validate equipment is properly structured',
    severity: 'info',
    validate: (data) => {
      const equipment = data?.equipment;
      
      if (!equipment) {
        return {
          valid: false,
          severity: 'info',
          message: 'No equipment data found',
          accuracy: 0,
          missingData: ['equipment']
        };
      }
      
      if (!Array.isArray(equipment)) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Equipment data is not in expected array format',
          accuracy: 30,
          suggestions: ['Equipment should be organized in categories']
        };
      }
      
      let totalItems = 0;
      let validCategories = 0;
      const categoryIssues: string[] = [];
      
      equipment.forEach((category: any, index: number) => {
        if (!category.category || typeof category.category !== 'string') {
          categoryIssues.push(`Category ${index + 1}: missing or invalid category name`);
          return;
        }
        
        if (!category.items || !Array.isArray(category.items)) {
          categoryIssues.push(`${category.category}: missing or invalid items array`);
          return;
        }
        
        validCategories++;
        totalItems += category.items.length;
      });
      
      const accuracy = equipment.length > 0 ? (validCategories / equipment.length) * 100 : 0;
      
      return {
        valid: categoryIssues.length === 0,
        severity: categoryIssues.length === 0 ? 'success' : 'warning',
        message: `${equipment.length} categories, ${totalItems} items total`,
        accuracy,
        details: categoryIssues.length > 0 ? categoryIssues : [
          `Valid categories: ${validCategories}`,
          `Total items: ${totalItems}`
        ]
      };
    }
  },
  
  {
    id: 'weapon-properties',
    name: 'Weapon Properties Validation',
    description: 'Validate weapon properties and damage',
    severity: 'info',
    validate: (data) => {
      const equipment = data?.equipment || [];
      let weaponCount = 0;
      let validWeapons = 0;
      const weaponIssues: string[] = [];
      
      equipment.forEach((category: any) => {
        if (category.category && category.category.toLowerCase().includes('weapon')) {
          const weapons = category.items || [];
          
          weapons.forEach((weapon: any) => {
            weaponCount++;
            const name = weapon.name || 'Unknown weapon';
            const details = weapon.details || '';
            
            // Basic weapon validation
            if (!details || details.trim() === '') {
              weaponIssues.push(`${name}: missing weapon properties/damage`);
              return;
            }
            
            // Check for damage information
            const hasDamage = /\d+d\d+/.test(details);
            const hasDamageType = DND5E_CONSTANTS.DAMAGE_TYPES.some(type => 
              details.toLowerCase().includes(type)
            );
            
            if (!hasDamage) {
              weaponIssues.push(`${name}: missing damage dice`);
              return;
            }
            
            if (!hasDamageType) {
              weaponIssues.push(`${name}: missing damage type`);
              return;
            }
            
            validWeapons++;
          });
        }
      });
      
      if (weaponCount === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'No weapons found',
          accuracy: 100
        };
      }
      
      const accuracy = (validWeapons / weaponCount) * 100;
      
      return {
        valid: weaponIssues.length === 0,
        severity: weaponIssues.length === 0 ? 'success' : 'info',
        message: `${validWeapons}/${weaponCount} weapons properly detailed`,
        accuracy,
        details: weaponIssues.length > 0 ? weaponIssues.slice(0, 5) : undefined
      };
    }
  },
  
  {
    id: 'armor-ac-contribution',
    name: 'Armor AC Contribution',
    description: 'Validate armor provides AC information',
    severity: 'info',
    validate: (data) => {
      const equipment = data?.equipment || [];
      let armorCount = 0;
      let validArmor = 0;
      const armorIssues: string[] = [];
      
      equipment.forEach((category: any) => {
        if (category.category && category.category.toLowerCase().includes('armor')) {
          const armors = category.items || [];
          
          armors.forEach((armor: any) => {
            armorCount++;
            const name = armor.name || 'Unknown armor';
            const details = armor.details || '';
            
            // Check for AC information
            const hasAC = /AC\s*\d+/.test(details) || /\+\d+\s*AC/.test(details);
            
            if (!hasAC) {
              armorIssues.push(`${name}: missing AC information`);
              return;
            }
            
            validArmor++;
          });
        }
      });
      
      if (armorCount === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'No armor items found',
          accuracy: 100
        };
      }
      
      const accuracy = (validArmor / armorCount) * 100;
      
      return {
        valid: armorIssues.length === 0,
        severity: armorIssues.length === 0 ? 'success' : 'info',
        message: `${validArmor}/${armorCount} armor items with AC details`,
        accuracy,
        details: armorIssues.length > 0 ? armorIssues : undefined
      };
    }
  }
];

/**
 * Spells Validation Rules
 */
export const spellsValidationRules: ValidationRule[] = [
  {
    id: 'spell-slots-progression',
    name: 'Spell Slot Progression',
    description: 'Validate spell slots match class progression',
    severity: 'warning',
    validate: (data) => {
      const spells = data?.spells;
      const classes = data?.classes || [];
      
      if (!spells || !spells.spellSlots) {
        // Check if character should have spells
        const spellcastingClasses = classes.filter((c: any) => {
          const className = c?.definition?.name?.toLowerCase() || '';
          return ['wizard', 'sorcerer', 'warlock', 'cleric', 'druid', 'bard', 'ranger', 'paladin'].includes(className);
        });
        
        if (spellcastingClasses.length === 0) {
          return {
            valid: true,
            severity: 'success',
            message: 'Non-spellcaster (no spell slots needed)',
            accuracy: 100
          };
        }
        
        return {
          valid: false,
          severity: 'warning',
          message: 'Spellcasting class but no spell slots found',
          accuracy: 60,
          missingData: ['spellSlots'],
          suggestions: ['Calculate spell slots based on class levels']
        };
      }
      
      const spellSlots = spells.spellSlots;
      const slotLevels = Object.keys(spellSlots)
        .filter(level => spellSlots[level] > 0)
        .map(level => parseInt(level));
      
      if (slotLevels.length === 0) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Spellcaster has no spell slots',
          accuracy: 50,
          suggestions: ['Verify spell slot calculations']
        };
      }
      
      // Basic validation - spell slots should be reasonable
      const totalSlots = Object.values(spellSlots).reduce((sum: number, slots: any) => sum + (slots || 0), 0);
      const highestLevel = Math.max(...slotLevels);
      
      return {
        valid: true,
        severity: 'success',
        message: `${totalSlots} spell slots, up to level ${highestLevel}`,
        accuracy: 100,
        details: slotLevels.map(level => `Level ${level}: ${spellSlots[level]} slots`)
      };
    }
  },
  
  {
    id: 'spell-list-validation',
    name: 'Known Spells Validation',
    description: 'Validate known spells structure and content',
    severity: 'info',
    validate: (data) => {
      const spells = data?.spells;
      
      if (!spells || !spells.knownSpells) {
        return {
          valid: true,
          severity: 'info',
          message: 'No known spells data',
          accuracy: 100
        };
      }
      
      const knownSpells = spells.knownSpells;
      
      if (!Array.isArray(knownSpells)) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Known spells is not an array',
          accuracy: 30
        };
      }
      
      if (knownSpells.length === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'No known spells',
          accuracy: 100
        };
      }
      
      let validSpells = 0;
      const spellIssues: string[] = [];
      
      knownSpells.forEach((spell: any, index: number) => {
        const name = spell.name || `Spell ${index + 1}`;
        
        if (!spell.name) {
          spellIssues.push(`Spell ${index + 1}: missing name`);
          return;
        }
        
        if (typeof spell.level !== 'number' || spell.level < 0 || spell.level > 9) {
          spellIssues.push(`${name}: invalid spell level`);
          return;
        }
        
        if (spell.school && !DND5E_CONSTANTS.SPELL_SCHOOLS.includes(spell.school.toLowerCase())) {
          spellIssues.push(`${name}: unknown spell school '${spell.school}'`);
        }
        
        validSpells++;
      });
      
      const accuracy = (validSpells / knownSpells.length) * 100;
      
      // Group spells by level for summary
      const spellsByLevel: Record<number, number> = {};
      knownSpells.forEach((spell: any) => {
        const level = spell.level || 0;
        spellsByLevel[level] = (spellsByLevel[level] || 0) + 1;
      });
      
      const levelSummary = Object.entries(spellsByLevel)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([level, count]) => `${level === '0' ? 'Cantrips' : `Level ${level}`}: ${count}`)
        .join(', ');
      
      return {
        valid: spellIssues.length === 0,
        severity: spellIssues.length === 0 ? 'success' : 'warning',
        message: `${knownSpells.length} known spells - ${levelSummary}`,
        accuracy,
        details: spellIssues.length > 0 ? spellIssues.slice(0, 5) : undefined
      };
    }
  }
];

/**
 * Features and Traits Validation Rules
 */
export const featuresValidationRules: ValidationRule[] = [
  {
    id: 'feature-completeness',
    name: 'Feature Completeness',
    description: 'Validate features have complete information',
    severity: 'info',
    validate: (data) => {
      const features = data?.features || [];
      
      if (!Array.isArray(features)) {
        return {
          valid: false,
          severity: 'warning',
          message: 'Features data is not in expected format',
          accuracy: 0,
          missingData: ['features']
        };
      }
      
      if (features.length === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'No character features found',
          accuracy: 50,
          suggestions: ['Character may have class/racial features that were not detected']
        };
      }
      
      let completeFeatures = 0;
      const featureIssues: string[] = [];
      
      features.forEach((feature: any, index: number) => {
        const name = feature.name || `Feature ${index + 1}`;
        
        if (!feature.name || feature.name.trim() === '') {
          featureIssues.push(`Feature ${index + 1}: missing name`);
          return;
        }
        
        if (!feature.description || feature.description.trim() === '') {
          featureIssues.push(`${name}: missing description`);
          return;
        }
        
        if (!feature.source) {
          featureIssues.push(`${name}: missing source information`);
        }
        
        completeFeatures++;
      });
      
      const accuracy = features.length > 0 ? (completeFeatures / features.length) * 100 : 0;
      
      // Categorize features by source
      const sourceTypes: Record<string, number> = {};
      features.forEach((feature: any) => {
        const source = feature.source || 'Unknown';
        const sourceType = source.includes('Race') ? 'Racial' :
                          source.includes('Class') || source.includes('Fighter') || source.includes('Wizard') ? 'Class' :
                          source.includes('Background') ? 'Background' :
                          source.includes('Feat') ? 'Feat' :
                          'Other';
        
        sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1;
      });
      
      const sourceSummary = Object.entries(sourceTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      
      return {
        valid: featureIssues.length === 0,
        severity: featureIssues.length === 0 ? 'success' : 'info',
        message: `${features.length} features (${sourceSummary})`,
        accuracy,
        details: featureIssues.length > 0 ? featureIssues.slice(0, 5) : [sourceSummary]
      };
    }
  },
  
  {
    id: 'class-feature-progression',
    name: 'Class Feature Progression',
    description: 'Validate expected class features are present',
    severity: 'info',
    validate: (data) => {
      const features = data?.features || [];
      const classes = data?.classes || [];
      
      if (classes.length === 0 || features.length === 0) {
        return {
          valid: true,
          severity: 'info',
          message: 'Insufficient data to validate class features',
          accuracy: 100
        };
      }
      
      let expectedFeatures = 0;
      let foundFeatures = 0;
      const missingFeatures: string[] = [];
      
      classes.forEach((classData: any) => {
        const className = classData?.definition?.name?.toLowerCase() || '';
        const classLevel = classData?.level || 0;
        const expectedClassFeatures = DND5E_CONSTANTS.CLASS_FEATURES[className] || [];
        
        expectedFeatures += expectedClassFeatures.length;
        
        expectedClassFeatures.forEach(expectedFeature => {
          const found = features.some((feature: any) => 
            feature.name?.toLowerCase().includes(expectedFeature.toLowerCase()) ||
            feature.source?.toLowerCase().includes(className)
          );
          
          if (found) {
            foundFeatures++;
          } else {
            missingFeatures.push(`${className}: ${expectedFeature}`);
          }
        });
      });
      
      const accuracy = expectedFeatures > 0 ? (foundFeatures / expectedFeatures) * 100 : 100;
      
      return {
        valid: missingFeatures.length === 0,
        severity: missingFeatures.length === 0 ? 'success' : 'info',
        message: missingFeatures.length === 0 
          ? `All expected class features found`
          : `${foundFeatures}/${expectedFeatures} expected features found`,
        accuracy,
        details: missingFeatures.length > 0 ? missingFeatures.slice(0, 5) : undefined,
        suggestions: missingFeatures.length > 0 ? ['Some expected class features may not have been detected'] : undefined
      };
    }
  }
];

// Export all validation rule sets
export const DnD5eValidationRules = {
  identity: identityValidationRules,
  abilities: abilityValidationRules,
  skills: skillsValidationRules,
  combat: combatValidationRules,
  equipment: equipmentValidationRules,
  spells: spellsValidationRules,
  features: featuresValidationRules
};

export default DnD5eValidationRules;