/*jshint esversion: 6 */
/*
 * Application State Module
 * 
 * Contains all global state variables for the D&D character converter application.
 * This includes character flags, level tracking, spell slots, ability scores,
 * equipment state, and other runtime application state.
 * 
 * State Categories:
 * - XML generation state
 * - Character data tracking  
 * - Class and race identification flags
 * - Level tracking by class
 * - Subclass and archetype tracking
 * - Equipment and combat state
 * - Ability scores and modifiers
 * - Feat and feature flags
 * - Miscellaneous application state
 */

// =============================================================================
// XML GENERATION STATE
// =============================================================================

let startXML = "";
let allXML = "";
let pcFilename = "";

// =============================================================================
// CHARACTER DATA TRACKING
// =============================================================================

let payFlag = 1;
let addHP = 0;
let hasAppear = 0;
let object;

// Character collections
let holdFeatures = [];
let holdProf = [];

// Caster tracking
let casterLevels = 0;
let casterClasses = 0;
let totalClasses = 0;

// Spell slot state (runtime - updated by spellSlots.js)
let charSpellSlots1 = 0;
let charSpellSlots2 = 0;
let charSpellSlots3 = 0;
let charSpellSlots4 = 0;
let charSpellSlots5 = 0;
let charSpellSlots6 = 0;
let charSpellSlots7 = 0;
let charSpellSlots8 = 0;
let charSpellSlots9 = 0;

// =============================================================================
// CLASS IDENTIFICATION FLAGS
// =============================================================================

let isArtificer = 0;
let isBarbarian = 0;
let isBard = 0;
let isCleric = 0;
let isDruid = 0;
let isFighter = 0;
let isMonk = 0;
let isPaladin = 0;
let isRanger = 0;
let isRogue = 0;
let isSorcerer = 0;
let isWarlock = 0;
let isWizard = 0;
let isBloodHunter = 0;

// =============================================================================
// RACE IDENTIFICATION FLAGS
// =============================================================================

// Core PHB races
let isDragonborn = 0;
let isDwarf = 0;
let isElf = 0;
let isHalfling = 0;
let isHalfOrc = 0;
let isHalfElf = 0;
let isHuman = 0;
let isTiefling = 0;
let isGnome = 0;

// Additional races
let isAarakocra = 0;
let isGenasi = 0;
let isGoliath = 0;
let isAasimar = 0;

// Volo's Guide races
var isBugbear = 0;
var isFirbolg = 0;
var isGoblin = 0;
var isHobgoblin = 0;
var isKenku = 0;
var isKobold = 0;
var isLizardfolk = 0;
var isOrc = 0;
var isTabaxi = 0;
var isTriton = 0;
var isYyantiPureblood = 0;
var isFeralTiefling = 0;
var isTortle = 0;

// Mordenkainen's races
var isGith = 0;

// Eberron races
var isChangling = 0;
var isKalashtar = 0;
let isShifter = 0;
let isWarforged = 0;

// Ravnica races
let isCentaur = 0;
let isLoxodon = 0;
let isMinotaur = 0;
let isSimicHybrid = 0;
let isVedalken = 0;

// =============================================================================
// LEVEL TRACKING BY CLASS
// =============================================================================

let levelBarbarian = 0;
let levelBard = 0;
let levelCleric = 0;
let levelDruid = 0;
let levelFighter = 0;
let levelMonk = 0;
let levelPaladin = 0;
let levelRanger = 0;
let levelRogue = 0;
let levelSorcerer = 0;
let levelWarlock = 0;
let levelWizard = 0;
let levelBloodHunter = 0;
var levelArtificer = 0;

// =============================================================================
// SUBCLASS AND ARCHETYPE TRACKING
// =============================================================================

// Fighter/Rogue subclass flags
var fighterSubclassEldritchKnight = 0;
var rogueSubclassArcaneTrickster = 0;

// Barbarian path tracking
var barbRages = 0;
var barbPrimalPath = "";
var barbTotemSpirit = "";
var barbBeastAspect = "";

// Class-specific archetypes
var bardCollege = "";
var clericDomain = "";
var druidCircle = "";
var fighterArchetype = "";
var monkWay = "";
var paladinOath = "";
var rangerArchtype = "";
var rogueArchetype = "";
var sorcererOrigin = "";
var warlockPatron = "";
var wizardSchool = "";

// =============================================================================
// EQUIPMENT AND COMBAT STATE
// =============================================================================

// Armor state
var wearingArmor = 0;
var usingHeavyArmor = 0;
var usingMediumArmor = 0;
var usingLightArmor = 0;
var usingShield = 0;

// Ammunition tracking
var numArrows = 0;
var numNeedles = 0;
var numBolts = 0;
var numBullets = 0;

// AC and saving throw bonuses
var addBonusArmorAC = 0;
var addBonusOtherAC = 0;
var addSavingThrows = 0;

// Movement
var addSpeed = 0;

// =============================================================================
// ABILITY SCORES AND MODIFIERS
// =============================================================================

// Strength
let strScore = 0;
let strMod = 0;
let strProf = 0;

// Charisma
let chaScore = 0;
let chaMod = 0;
let chaProf = 0;

// Constitution
let conScore = 0;
let conMod = 0;
let conProf = 0;

// Intelligence
let intScore = 0;
let intMod = 0;
let intProf = 0;

// Dexterity
let dexScore = 0;
let dexMod = 0;
let dexProf = 0;

// Wisdom
let wisScore = 0;
let wisMod = 0;
let wisProf = 0;

// =============================================================================
// FEAT AND FEATURE FLAGS
// =============================================================================

let mamFeat = 0;      // Mobile Archer Master
let alertFeat = 0;    // Alert feat
let mobileFeat = 0;   // Mobile feat
let obsFeat = 0;      // Observant feat

// =============================================================================
// MISCELLANEOUS APPLICATION STATE
// =============================================================================

// Character totals
let totalLevels = 0;
let totalHP = 0;
let sumHP = 0;

// Bonuses and modifiers
let profBonus = 0;
let passWisBonus = 0;

// Movement
let charWalk = 0;

// Fantasy Grounds version (0: Classic, 1: Unity)
let fgVersion = 1; // Default to Unity

// Global character ID for UI
let glCharID = "";

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make all application state variables globally available
if (typeof window !== 'undefined') {
    // XML generation state
    window.startXML = startXML;
    window.allXML = allXML;
    window.pcFilename = pcFilename;
    
    // Character data tracking
    window.payFlag = payFlag;
    window.addHP = addHP;
    window.hasAppear = hasAppear;
    window.object = object;
    window.holdFeatures = holdFeatures;
    window.holdProf = holdProf;
    window.casterLevels = casterLevels;
    window.casterClasses = casterClasses;
    window.totalClasses = totalClasses;
    
    // Spell slots
    window.charSpellSlots1 = charSpellSlots1;
    window.charSpellSlots2 = charSpellSlots2;
    window.charSpellSlots3 = charSpellSlots3;
    window.charSpellSlots4 = charSpellSlots4;
    window.charSpellSlots5 = charSpellSlots5;
    window.charSpellSlots6 = charSpellSlots6;
    window.charSpellSlots7 = charSpellSlots7;
    window.charSpellSlots8 = charSpellSlots8;
    window.charSpellSlots9 = charSpellSlots9;
    
    // Class flags
    window.isArtificer = isArtificer;
    window.isBarbarian = isBarbarian;
    window.isBard = isBard;
    window.isCleric = isCleric;
    window.isDruid = isDruid;
    window.isFighter = isFighter;
    window.isMonk = isMonk;
    window.isPaladin = isPaladin;
    window.isRanger = isRanger;
    window.isRogue = isRogue;
    window.isSorcerer = isSorcerer;
    window.isWarlock = isWarlock;
    window.isWizard = isWizard;
    window.isBloodHunter = isBloodHunter;
    
    // Race flags
    window.isDragonborn = isDragonborn;
    window.isDwarf = isDwarf;
    window.isElf = isElf;
    window.isHalfling = isHalfling;
    window.isHalfOrc = isHalfOrc;
    window.isHalfElf = isHalfElf;
    window.isHuman = isHuman;
    window.isTiefling = isTiefling;
    window.isGnome = isGnome;
    window.isAarakocra = isAarakocra;
    window.isGenasi = isGenasi;
    window.isGoliath = isGoliath;
    window.isAasimar = isAasimar;
    window.isBugbear = isBugbear;
    window.isFirbolg = isFirbolg;
    window.isGoblin = isGoblin;
    window.isHobgoblin = isHobgoblin;
    window.isKenku = isKenku;
    window.isKobold = isKobold;
    window.isLizardfolk = isLizardfolk;
    window.isOrc = isOrc;
    window.isTabaxi = isTabaxi;
    window.isTriton = isTriton;
    window.isYyantiPureblood = isYyantiPureblood;
    window.isFeralTiefling = isFeralTiefling;
    window.isTortle = isTortle;
    window.isGith = isGith;
    window.isChangling = isChangling;
    window.isKalashtar = isKalashtar;
    window.isShifter = isShifter;
    window.isWarforged = isWarforged;
    window.isCentaur = isCentaur;
    window.isLoxodon = isLoxodon;
    window.isMinotaur = isMinotaur;
    window.isSimicHybrid = isSimicHybrid;
    window.isVedalken = isVedalken;
    
    // Level tracking
    window.levelBarbarian = levelBarbarian;
    window.levelBard = levelBard;
    window.levelCleric = levelCleric;
    window.levelDruid = levelDruid;
    window.levelFighter = levelFighter;
    window.levelMonk = levelMonk;
    window.levelPaladin = levelPaladin;
    window.levelRanger = levelRanger;
    window.levelRogue = levelRogue;
    window.levelSorcerer = levelSorcerer;
    window.levelWarlock = levelWarlock;
    window.levelWizard = levelWizard;
    window.levelBloodHunter = levelBloodHunter;
    window.levelArtificer = levelArtificer;
    
    // Subclass tracking
    window.fighterSubclassEldritchKnight = fighterSubclassEldritchKnight;
    window.rogueSubclassArcaneTrickster = rogueSubclassArcaneTrickster;
    window.barbRages = barbRages;
    window.barbPrimalPath = barbPrimalPath;
    window.barbTotemSpirit = barbTotemSpirit;
    window.barbBeastAspect = barbBeastAspect;
    window.bardCollege = bardCollege;
    window.clericDomain = clericDomain;
    window.druidCircle = druidCircle;
    window.fighterArchetype = fighterArchetype;
    window.monkWay = monkWay;
    window.paladinOath = paladinOath;
    window.rangerArchtype = rangerArchtype;
    window.rogueArchetype = rogueArchetype;
    window.sorcererOrigin = sorcererOrigin;
    window.warlockPatron = warlockPatron;
    window.wizardSchool = wizardSchool;
    
    // Equipment state
    window.wearingArmor = wearingArmor;
    window.usingHeavyArmor = usingHeavyArmor;
    window.usingMediumArmor = usingMediumArmor;
    window.usingLightArmor = usingLightArmor;
    window.usingShield = usingShield;
    window.numArrows = numArrows;
    window.numNeedles = numNeedles;
    window.numBolts = numBolts;
    window.numBullets = numBullets;
    window.addBonusArmorAC = addBonusArmorAC;
    window.addBonusOtherAC = addBonusOtherAC;
    window.addSavingThrows = addSavingThrows;
    window.addSpeed = addSpeed;
    
    // Ability scores
    window.strScore = strScore;
    window.strMod = strMod;
    window.strProf = strProf;
    window.chaScore = chaScore;
    window.chaMod = chaMod;
    window.chaProf = chaProf;
    window.conScore = conScore;
    window.conMod = conMod;
    window.conProf = conProf;
    window.intScore = intScore;
    window.intMod = intMod;
    window.intProf = intProf;
    window.dexScore = dexScore;
    window.dexMod = dexMod;
    window.dexProf = dexProf;
    window.wisScore = wisScore;
    window.wisMod = wisMod;
    window.wisProf = wisProf;
    
    // Feats and features
    window.mamFeat = mamFeat;
    window.alertFeat = alertFeat;
    window.mobileFeat = mobileFeat;
    window.obsFeat = obsFeat;
    
    // Miscellaneous
    window.totalLevels = totalLevels;
    window.totalHP = totalHP;
    window.sumHP = sumHP;
    window.profBonus = profBonus;
    window.passWisBonus = passWisBonus;
    window.charWalk = charWalk;
    window.fgVersion = fgVersion;
    window.glCharID = glCharID;
}