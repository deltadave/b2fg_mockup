/*jshint esversion: 6 */
/*
 * Spell Slots Module
 * 
 * Contains spell slot calculation logic for D&D 5e multiclassing rules.
 * Handles complex spell slot calculations for single and multiclass characters
 * across all spellcasting classes including full casters, half casters, and 
 * third casters (Artificer).
 * 
 * Functions:
 * - getSpellSlots() - Main spell slot calculation function
 * 
 * Dependencies:
 * - Requires global variables for spell slot storage (charSpellSlots1-9)
 * - Requires casterClasses global variable
 */

// =============================================================================
// SPELL SLOT CALCULATION LOGIC
// =============================================================================

/**
 * Calculate spell slots for a character based on class, level, and subclass
 * Handles D&D 5e multiclassing spell slot rules for all caster types
 * @param {string} slotClass - The spellcasting class (bard, cleric, etc.)
 * @param {number} slotLevel - The character level in that class
 * @param {string} slotSubClass - The subclass (for partial casters like rangers)
 * @returns {void} - Updates global charSpellSlots1-9 variables
 */
function getSpellSlots(slotClass, slotLevel, slotSubClass) {
    if (casterClasses == 1) {
        if((slotClass === "bard") || (slotClass === "cleric") || (slotClass === "druid") || (slotClass === "sorcerer") || (slotClass === "wizard")) {
            if (slotLevel == 1) {
                charSpellSlots1 = 2;
            } else if (slotLevel == 2) {
                charSpellSlots1 = 3;
            } else if (slotLevel == 3) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 2;
            } else if (slotLevel == 4) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
            } else if (slotLevel == 5) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 2;
            } else if (slotLevel == 6) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
            } else if (slotLevel == 7) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 1;
            } else if (slotLevel == 8) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 2;
            } else if (slotLevel == 9) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 1;
            } else if (slotLevel == 10) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
            } else if (slotLevel == 11) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
            } else if (slotLevel == 12) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
            } else if (slotLevel == 13) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
            } else if (slotLevel == 14) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
            } else if (slotLevel == 15) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
            } else if (slotLevel == 16) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
            } else if (slotLevel == 17) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
            } else if (slotLevel == 18) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
            } else if (slotLevel == 19) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 2;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
            } else if (slotLevel == 20) {
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 2;
                charSpellSlots7 = 2;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
            }
        } else if(slotClass === "paladin") {
            switch(slotLevel) {
                case 2:
                    charSpellSlots1 = 2;
                    break;
                case 3:
                    charSpellSlots1 = 3;
                    break;
                case 4:
                    charSpellSlots1 = 3;
                    break;
                case 5:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 2;
                    break;
                case 6:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 2;
                    break;
                case 7:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    break;
                case 8:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    break;
                case 9:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 2;
                    break;
                case 10:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 2;
                    break;
                case 11:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    break;
                case 12:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    break;
                case 13:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 1;
                    break;
                case 14:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 1;
                    break;
                case 15:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 2;
                    break;
                case 16:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 2;
                    break;
                case 17:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 1;
                    break;
                case 18:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 1;
                    break;
                case 19:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 2;
                    break;
                case 20:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 2;
                    break;
            }
        } else if(slotClass === "ranger") {
            if(slotSubClass == "spellless") {
                console.log("Spellless ranger - no spell slots");
            } else {
                switch(slotLevel) {
                    case 2:
                        charSpellSlots1 = 2;
                        break;
                    case 3:
                        charSpellSlots1 = 3;
                        break;
                    case 4:
                        charSpellSlots1 = 3;
                        break;
                    case 5:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 6:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 7:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 8:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 9:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 10:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 11:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 12:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 13:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                    case 14:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                    case 15:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 2;
                        break;
                    case 16:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 2;
                        break;
                    case 17:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 3;
                        charSpellSlots5 = 1;
                        break;
                    case 18:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 3;
                        charSpellSlots5 = 1;
                        break;
                    case 19:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 3;
                        charSpellSlots5 = 2;
                        break;
                    case 20:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 3;
                        charSpellSlots5 = 2;
                        break;
                }
            }
        } else if(slotClass === "warlock") {
            console.log("Warlock uses Pact Magic - handled separately");
        } else if(slotClass === "fighter") {
            if(slotSubClass == "eldritch_knight") {
                switch(slotLevel) {
                    case 3:
                        charSpellSlots1 = 2;
                        break;
                    case 4:
                        charSpellSlots1 = 3;
                        break;
                    case 5:
                        charSpellSlots1 = 3;
                        break;
                    case 6:
                        charSpellSlots1 = 3;
                        break;
                    case 7:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 8:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 9:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 10:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 11:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 12:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 13:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 14:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 15:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 16:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 17:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 18:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 19:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                    case 20:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                }
            }
        } else if(slotClass === "rogue") {
            if(slotSubClass == "arcane_trickster") {
                switch(slotLevel) {
                    case 3:
                        charSpellSlots1 = 2;
                        break;
                    case 4:
                        charSpellSlots1 = 3;
                        break;
                    case 5:
                        charSpellSlots1 = 3;
                        break;
                    case 6:
                        charSpellSlots1 = 3;
                        break;
                    case 7:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 8:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 9:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 2;
                        break;
                    case 10:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 11:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 12:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        break;
                    case 13:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 14:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 15:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 2;
                        break;
                    case 16:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 17:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 18:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        break;
                    case 19:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                    case 20:
                        charSpellSlots1 = 4;
                        charSpellSlots2 = 3;
                        charSpellSlots3 = 3;
                        charSpellSlots4 = 1;
                        break;
                }
            }
        } else if(slotClass === "artificer") {
            console.log("Artificer spell slots");
            switch(slotLevel) {
                case 1:
                    charSpellSlots1 = 2;
                    break;
                case 2:
                    charSpellSlots1 = 2;
                    break;
                case 3:
                    charSpellSlots1 = 3;
                    break;
                case 4:
                    charSpellSlots1 = 3;
                    break;
                case 5:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 2;
                    break;
                case 6:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 2;
                    break;
                case 7:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    break;
                case 8:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    break;
                case 9:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 2;
                    break;
                case 10:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 2;
                    break;
                case 11:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    break;
                case 12:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    break;
                case 13:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 1;
                    break;
                case 14:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 1;
                    break;
                case 15:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 2;
                    break;
                case 16:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 2;
                    break;
                case 17:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 1;
                    break;
                case 18:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 1;
                    break;
                case 19:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 2;
                    break;
                case 20:
                    charSpellSlots1 = 4;
                    charSpellSlots2 = 3;
                    charSpellSlots3 = 3;
                    charSpellSlots4 = 3;
                    charSpellSlots5 = 2;
                    break;
                default:
                    console.log("Artificer level " + slotLevel + " has no spell slots");
                    break;
            }
        }
    } else if (casterClasses > 1) {
        // Multiclassing spell slot calculation
        console.log("Multiclass caster - calculating combined spell slots");
        
        // Calculate total caster level for multiclassing
        let totalCasterLevel = casterLevels;
        
        // Set spell slots based on total caster level (multiclass spellcasting table)
        switch(totalCasterLevel) {
            case 1:
                charSpellSlots1 = 2;
                break;
            case 2:
                charSpellSlots1 = 3;
                break;
            case 3:
                charSpellSlots1 = 4;
                charSpellSlots2 = 2;
                break;
            case 4:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                break;
            case 5:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 2;
                break;
            case 6:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                break;
            case 7:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 1;
                break;
            case 8:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 2;
                break;
            case 9:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 1;
                break;
            case 10:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                break;
            case 11:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                break;
            case 12:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                break;
            case 13:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                break;
            case 14:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                break;
            case 15:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                break;
            case 16:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                break;
            case 17:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 2;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
                break;
            case 18:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 1;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
                break;
            case 19:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 2;
                charSpellSlots7 = 1;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
                break;
            case 20:
                charSpellSlots1 = 4;
                charSpellSlots2 = 3;
                charSpellSlots3 = 3;
                charSpellSlots4 = 3;
                charSpellSlots5 = 3;
                charSpellSlots6 = 2;
                charSpellSlots7 = 2;
                charSpellSlots8 = 1;
                charSpellSlots9 = 1;
                break;
        }
            
    }
}

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make spell slot calculation function globally available
if (typeof window !== 'undefined') {
    window.getSpellSlots = getSpellSlots;
}