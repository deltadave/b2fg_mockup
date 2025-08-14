/*jshint esversion: 6 */
/*
 * Game Constants Module
 * 
 * Contains all D&D 5e game rules constants, mappings, and configuration data
 * used throughout the character converter. This includes ability scores, 
 * skills, weapons, armor, class data, and other game mechanics.
 * 
 * Constants included:
 * - Ability score mappings and arrays
 * - Skill lists and ability score references  
 * - Weapon and armor classifications
 * - Class and race identification arrays
 * - HP constants by class
 * - XML formatting constants
 * - Debug and configuration flags
 */

// =============================================================================
// DEBUG AND CONFIGURATION
// =============================================================================

const DEBUG = false;

// =============================================================================
// XML FORMATTING CONSTANTS
// =============================================================================

const endXML = "\t</character>\n</root>\n";

// Character data source identifiers
const source = [
    "Barakas(1387127)",
    "Baradun(1215852)",
];

// =============================================================================
// D&D 5E ABILITY SCORE CONSTANTS
// =============================================================================

// Ability score ID to abbreviation mapping
const _ABILITIES = {1:"STR",2:"DEX",3:"CON",4:"INT",5:"WIS",6:"CHA"};

// Ability score abbreviation to full name mapping
const _ABILITY = {"STR": "strength", "DEX": "dexterity", "CON": "constitution", "INT": "intelligence", "WIS": "wisdom", "CHA": "charisma"};

// Ordered array of ability score names
const justAbilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

// =============================================================================
// D&D 5E SKILLS AND PROFICIENCIES
// =============================================================================

// All D&D 5e skills in alphabetical order
const skills = ["acrobatics", "animal_handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight_of_hand", "stealth", "survival"];

// Corresponding ability scores for each skill (same order as skills array)
const skillsRef = ["dexterity", "wisdom", "intelligence", "strength", "charisma", "intelligence", "wisdom", "charisma", "intelligence", "wisdom", "intelligence", "wisdom", "charisma", "charisma", "intelligence", "dexterity", "dexterity", "wisdom"];

// =============================================================================
// D&D 5E WEAPON CLASSIFICATIONS
// =============================================================================

// Simple melee weapons
const simpleMeleeWeapon = ["club","dagger","greatclub","handaxe","javelin","light_hammer","mace","quartrsfaff","sickle","spear"];

// Simple ranged weapons
const simpleRangedWeapon = ["crossbow_light","dart","showtbow","sling"];

// Martial melee weapons
const martialMeleeWeapon = ["battleaxe","flail","glaive","greataxe","greatsword","halberd","lance","longsword","maul","morningstar","pike","rapier","scimitar","shortsword","trident","war_pick","warhammer","whip"];

// Martial ranged weapons
const martialRangedWeapon = ["blowgun","crossbow_hand","crossbow_heavy","longbow","net"];

// =============================================================================
// D&D 5E ARMOR CLASSIFICATIONS
// =============================================================================

// Light armor (full Dex modifier to AC)
const fullDexArmor = ["padded","leather","studded_leather"];

// Armor with max +3 Dex modifier (currently empty in 5e)
const max3DexArmor = [];

// Medium armor (max +2 Dex modifier to AC)
const max2DexArmor = ["hide","chain_shirt","scale_mail","breastplate","half_plate"];

// Heavy armor (no Dex modifier to AC)
const noDexArmor = ["ring_mail","chain_mail","splint","plate"];

// Armor that imposes disadvantage on stealth (commented out - reference only)
// const disStealth = ["padded","scale_mail","half_plate","ring_mail","chain_mail","splint","plate"];

// =============================================================================
// D&D 5E RACIAL TRAITS
// =============================================================================

// Tiefling racial traits
const tieflingRacialTraits = ["darkvision","hellish_resistance"];

// =============================================================================
// D&D 5E CLASS HIT POINTS
// =============================================================================

// Hit points gained per level by class (average of hit die)
const hpBarbarian = 7;       // d12 hit die
const hpBard = 5;           // d8 hit die
const hpCleric = 5;         // d8 hit die
const hpDruid = 5;          // d8 hit die
const hpFighter = 6;        // d10 hit die
const hpMonk = 5;           // d8 hit die
const hpPaladin = 6;        // d10 hit die
const hpRanger = 6;         // d10 hit die
const hpRogue = 5;          // d8 hit die
const hpSorcerer = 4;       // d6 hit die
const hpWarlock = 5;        // d8 hit die
const hpWizard = 4;         // d6 hit die
const hpBloodHunter = 6;    // d10 hit die
const hpArtificer = 5;      // d8 hit die

// Starting hit points at 1st level by class (max hit die + CON modifier)
const hpStartBarbarian = 12;    // 12 + CON
const hpStartBard = 8;          // 8 + CON
const hpStartCleric = 8;        // 8 + CON
const hpStartDruid = 8;         // 8 + CON
const hpStartFighter = 10;      // 10 + CON
const hpStartMonk = 8;          // 8 + CON
const hpStartPaladin = 10;      // 10 + CON
const hpStartRanger = 10;       // 10 + CON
const hpStartRogue = 8;         // 8 + CON
const hpStartSorcerer = 6;      // 6 + CON
const hpStartWarlock = 8;       // 8 + CON
const hpStartWizard = 6;        // 6 + CON
const hpStartBloodhunter = 10;  // 10 + CON
const hpStartArtificer = 8;     // 8 + CON

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make all game constants globally available for use by other scripts
if (typeof window !== 'undefined') {
    // Debug and configuration
    window.DEBUG = DEBUG;
    
    // XML formatting constants
    window.endXML = endXML;
    window.source = source;
    
    // Ability score constants
    window._ABILITIES = _ABILITIES;
    window._ABILITY = _ABILITY;
    window.justAbilities = justAbilities;
    
    // Skills and proficiencies
    window.skills = skills;
    window.skillsRef = skillsRef;
    
    // Weapon classifications
    window.simpleMeleeWeapon = simpleMeleeWeapon;
    window.simpleRangedWeapon = simpleRangedWeapon;
    window.martialMeleeWeapon = martialMeleeWeapon;
    window.martialRangedWeapon = martialRangedWeapon;
    
    // Armor classifications
    window.fullDexArmor = fullDexArmor;
    window.max3DexArmor = max3DexArmor;
    window.max2DexArmor = max2DexArmor;
    window.noDexArmor = noDexArmor;
    
    // Racial traits
    window.tieflingRacialTraits = tieflingRacialTraits;
    
    // Class hit points
    window.hpBarbarian = hpBarbarian;
    window.hpBard = hpBard;
    window.hpCleric = hpCleric;
    window.hpDruid = hpDruid;
    window.hpFighter = hpFighter;
    window.hpMonk = hpMonk;
    window.hpPaladin = hpPaladin;
    window.hpRanger = hpRanger;
    window.hpRogue = hpRogue;
    window.hpSorcerer = hpSorcerer;
    window.hpWarlock = hpWarlock;
    window.hpWizard = hpWizard;
    window.hpBloodHunter = hpBloodHunter;
    window.hpArtificer = hpArtificer;
    
    // Starting hit points
    window.hpStartBarbarian = hpStartBarbarian;
    window.hpStartBard = hpStartBard;
    window.hpStartCleric = hpStartCleric;
    window.hpStartDruid = hpStartDruid;
    window.hpStartFighter = hpStartFighter;
    window.hpStartMonk = hpStartMonk;
    window.hpStartPaladin = hpStartPaladin;
    window.hpStartRanger = hpStartRanger;
    window.hpStartRogue = hpStartRogue;
    window.hpStartSorcerer = hpStartSorcerer;
    window.hpStartWarlock = hpStartWarlock;
    window.hpStartWizard = hpStartWizard;
    window.hpStartBloodhunter = hpStartBloodhunter;
    window.hpStartArtificer = hpStartArtificer;
}