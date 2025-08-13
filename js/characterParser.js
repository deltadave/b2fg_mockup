/*jshint esversion: 6 */
/*
 * Character Parser Module
 * 
 * Contains the main character parsing logic for converting D&D Beyond character data
 * to Fantasy Grounds XML format. This includes the massive parseCharacter function
 * and related character processing utilities.
 * 
 * Extracted from app.js for better modularity and maintainability.
 * 
 * Functions:
 * - parseCharacter: Main character processing function (~3,286 lines)
 * - Character data extraction and transformation
 * - XML building and formatting for Fantasy Grounds
 */

// =============================================================================
// CHARACTER PARSING FUNCTIONS
// =============================================================================
function parseCharacter(inputChar) {
    // Performance baseline: detailed timing for parseCharacter phases
    const parseStartTime = performance.now();
    console.log('=== Character Processing Performance Baseline ===');
    
    // Performance optimization: cache expensive getObjects() calls
    const objectCache = new Map();
    
    // Cached version of getObjects to avoid repeated recursive searches
    function getCachedObjects(obj, key, val) {
        const cacheKey = `${key}:${val}`;
        if (objectCache.has(cacheKey)) {
            return objectCache.get(cacheKey);
        }
        
        const result = getObjects(obj, key, val);
        objectCache.set(cacheKey, result);
        return result;
    }
    
    // Helper function to safely access properties and prevent null reference errors
    function safeAccess(obj, path, defaultValue = null) {
        try {
            const result = path.split('.').reduce((current, key) => current && current[key], obj);
            return result !== undefined && result !== null ? result : defaultValue;
        } catch (e) {
            console.warn(`Safe access failed for path: ${path}`, e);
            return defaultValue;
        }
    }
    
    // Handle v5 API response structure - extract actual character data
    var rawResponse = jQuery.extend(true, {}, inputChar);
    var character;
    
    // Debug: Log the structure of the received data
    console.log("Received raw response:", rawResponse);
    console.log("Raw response keys:", Object.keys(rawResponse));
    
    // Check if this is v5 format with nested data
    if (rawResponse.data && rawResponse.success) {
        console.log("V5 format detected - using nested data");
        character = rawResponse.data;
    } else {
        console.log("Legacy format detected - using direct data");
        character = rawResponse;
    }
    
    console.log("Using character data:", character);
    console.log("Character data keys:", Object.keys(character));
    
    if(character.hasOwnProperty("errorCode")) {
        var alertString = " could not be found.\n";
        alertString += "Either the character doesn't actually exist,\n";
        alertString += "or the character is set to 'Private' instead of 'Public'.\n\n";
        alertString += "Yes, your character MUST be set to PUBLIC.";
        // Secure error notification - validate character ID before displaying
        const charIdValidation = validateCharacterID($("#getcharID").val());
        const displayId = charIdValidation.valid ? charIdValidation.sanitized : "[Invalid ID]";
        showSecureNotification(`Character ${displayId}: ${alertString.replace(/\n/g, ' ')}`, 'error', 8000);
    } else {
        if (fgVersion == 0) {
            startXML = "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n";
            startXML += "<root version=\"3.3\" release=\"8|CoreRPG:4\">\n";
            startXML += "\t<character>\n";
        } else {
            startXML = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
            startXML += "<root version=\"4\" dataversion=\"20191121\" release=\"8|CoreRPG:4\">\n";
            startXML += "\t<character>\n";
        }
    allXML = startXML;
    var buildXML = "\t\t<!--" + $("#getcharID").val().trim() + "-->\n";

    // Handle character name with safety check
    const characterName = character.name || "Unknown Character";
    console.log("Character name found:", characterName);
    
    pcFilename = characterName.replace(/\W/g, '');
    buildXML += `\t\t<name type="string">${characterName}</name>\n`;
    
    // Performance timing: basic setup complete
    const setupTime = performance.now();
    console.log(`Basic setup time: ${(setupTime - parseStartTime).toFixed(2)}ms`);

    // Alignment
    // 1. Lawful Good
    // 2. Neutral Good
    // 3. Chaotic Good
    // 4. Lawful Neutral
    // 5. Neutral
    // 6. Chaotic Neutral
    // 7. Lawful Evil
    // 8. Neutral Evil
    // 9. Chaotic Evil
    const alignmentMap = {
        1: "Lawful Good",
        2: "Neutral Good", 
        3: "Chaotic Good",
        4: "Lawful Neutral",
        5: "Neutral",
        6: "Chaotic Neutral",
        7: "Lawful Evil",
        8: "Neutral Evil",
        9: "Chaotic Evil"
    };
    const charAlign = alignmentMap[character.alignmentId] || "None Selected";

    buildXML += `\t\t<alignment type="string">${charAlign}</alignment>\n`;
    character.race.racialTraits.some((fleet_trait, i) => {
        if(fleet_trait.definition.name == "Fleet of Foot" || fleet_trait.definition.name == "Swift") {
            addSpeed += 5;
        }
    });

    // Destructure character traits for cleaner access
    const { personalityTraits, ideals, bonds, flaws } = character.traits;
    
    if(personalityTraits != null) {
        buildXML += `\t\t<personalitytraits type="string">${fixQuote(personalityTraits)}</personalitytraits>\n`;
    }
    if(ideals != null) {
        buildXML += `\t\t<ideals type="string">${fixQuote(ideals)}</ideals>\n`;
    }
    if(bonds != null) {
        buildXML += `\t\t<bonds type="string">${fixQuote(bonds)}</bonds>\n`;
    }
    if(flaws != null) {
        buildXML += `\t\t<flaws type="string">${fixQuote(flaws)}</flaws>\n`;
    }

    var background = '';
    if(character.background.definition != null) {
        background = character.background.definition.name;
    }

    if(background == '' && character.background.customBackground.name != null) {
        background = character.background.customBackground.name;
    }

    buildXML += `\t\t<background type="string">${background}</background>\n`;
    buildXML += "\t\t<backgroundlink type=\"windowreference\">\n";
    buildXML += "\t\t\t<class>reference_background</class>\n";
    if(background.match(/Artisan\s\/\sGuild/)) {
        background = "guildartisan";
    } else if(background.match(/House\sAgent/)) {
        background = "houseagent";
    } else if (background.match(/Criminal\s\/\sSpy/)) {
        background = "spy";
    }
    buildXML += `\t\t\t<recordname>reference.backgrounddata.${background.toLowerCase().replace(/\s/g, "")}@*</recordname>\n`;
    buildXML += "\t\t</backgroundlink>\n";

    buildXML += `\t\t<race type="string">${character.race.fullName}</race>\n`;
    buildXML += "\t\t<racelink type=\"windowreference\">\n";
    buildXML += "\t\t\t<class>reference_race</class>\n";
    buildXML += `\t\t\t<recordname>reference.racedata.${replaceDash(character.race.baseName.toLowerCase())}@*</recordname>\n`;
    buildXML += "\t\t</racelink>\n";

    switch (character.race.baseName.toLowerCase()) {
        case 'tiefling':
            isTiefling = 1;
            break;
        case 'dragonborn':
            isDragonborn = 1;
            break;
        case 'dwarf':
            isDwarf = 1;
            break;
        case 'elf':
            isElf = 1;
            break;
        case 'gnome':
            isGnome = 1;
            break;
        case 'half-elf':
            isHalfElf = 1;
            break;
        case 'halfling':
            isHalfling = 1;
            break;
        case 'half-orc':
            isHalfOrc = 1;
            break;
        case 'human':
            isHuman = 1;
            break;
    }

    // Attempt at skill list
    var idCount = 1;
    var hasHalf = 0;
    //var halfProf = false;
    var profValue = 0;
    var halfprof = getCachedObjects(character, 'type', 'half-proficiency');
    for (var x in halfprof) {
        var hfprof = halfprof[x];
        var type = hfprof.subType;
        if(type == 'ability-checks') {
            hasHalf = 1;
        }
    }
    // Performance timing: start skills processing
    const skillsStartTime = performance.now();
    console.log(`Pre-skills time: ${(skillsStartTime - setupTime).toFixed(2)}ms`);
    
    buildXML += "\t\t<skilllist>\n";
    skills.some(function(element) {
        profValue = 0;
        thisIteration = pad(idCount, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<misc type=\"number\">0</misc>\n";
        if(element.match(/^sleight/)) {
            buildXML += "\t\t\t\t<name type=\"string\">Sleight of Hand</name>\n";
        } else if(element.match(/animal/)) {
            buildXML += "\t\t\t\t<name type=\"string\">Animal Handling</name>\n";
        } else {
            buildXML += "\t\t\t\t<name type=\"string\">" + capitalizeFirstLetter(element) + "</name>\n";
        }
        buildXML += "\t\t\t\t<stat type=\"string\">" + skillsRef[idCount - 1] + "</stat>\n";

        var proficiencies = getCachedObjects(character, 'type', 'proficiency');
        if(proficiencies != null) {
            proficiencies.some(function(prof) {
                var skill = prof.subType.replace(/-/g, '_');
                if(skill == element) {
                    profValue = 1;
                }
            });
        }
        var expertise = getCachedObjects(character, 'type', 'expertise');
        if(expertise != null) {
            expertise.some(function(exp) {
                var expSkill = exp.subType.replace(/-/g, '_');
                if(expSkill == element) {
                    profValue = 2;
                }
            });
        }

        if(profValue == 0) {
            if(hasHalf == 1) {
                buildXML += "\t\t\t\t<prof type=\"number\">3</prof>\n";
            } else {
                buildXML += "\t\t\t\t<prof type=\"number\">0</prof>\n";
            }
        } else if(profValue == 1) {
            buildXML += "\t\t\t\t<prof type=\"number\">1</prof>\n";
        } else if(profValue == 2) {
            buildXML += "\t\t\t\t<prof type=\"number\">2</prof>\n";
        }

        buildXML += `\t\t\t</id-${thisIteration}>\n`;
        idCount += 1;
    });
    buildXML += "\t\t</skilllist>\n";
    
    // Performance timing: skills processing complete  
    const skillsEndTime = performance.now();
    console.log(`Skills processing time: ${(skillsEndTime - skillsStartTime).toFixed(2)}ms`);

    buildXML += "\t\t<classes>\n";

    character.classes.some(function(current_class, i) {
        thisClass = current_class.definition.name.toLowerCase();
        //console.log("Class: " + thisClass);
         if (thisClass == "barbarian") {
            isBarbarian = 1;
            levelBarbarian = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartBarbarian + ((levelBarbarian - 1) * hpBarbarian);
                //sumHP += hpStartBard + ((levelBard - 1) * hpBard);
            } else {
                sumHP += levelBarbarian  * hpBarbarian;
            }


            switch (parseInt(levelBarbarian)) {
                case 1: case 2:
                    barbRages = 2;
                    break;
                case 3: case 4: case 5:
                    barbRages = 3;
                    break;
                case 6: case 7: case 8: case 9: case 10: case 11:
                    barbRages = 4;
                    break;
                case 12: case 13: case 14: case 15: case 16:
                    barbRages = 5;
                    break;
                case 17: case 18: case 19:
                    barbRages = 6;
                    break;
                default:
                    barbRages = 0;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                barbPrimalPath = current_class.subclassDefinition.name;
                current_class.subclassDefinition.classFeatures.some(function(findTotem, j) {
                    if(levelBarbarian >= findTotem.requiredLevel) {
                        if (findTotem.name.match("Totem Spirit")) {
                            animalID = findTotem.id;
                            character.options.class.some(function(guessing, k) {
                                if (animalID == guessing.componentId) {
                                    barbTotemSpirit = guessing.definition.name;
                                }
                            });
                        } else if (findTotem.name.match("Aspect of the Beast")) {
                            animalID = findTotem.id;
                            character.options.class.some(function(guessing, k) {
                                if (animalID == guessing.componentId) {
                                    barbBeastAspect = guessing.definition.name;
                                }
                            });
                        } else if (findTotem.name.match("Totemic Attunement")) {
                            animalID = findTotem.id;
                            character.options.class.some(function(guessing, k) {
                                if (animalID == guessing.componentId) {
                                    barbTotemAttune = guessing.definition.name;
                                }
                            });
                        }
                    }
                });
            }
        } else if (thisClass == "bard") {
            isBard = 1;
            levelBard = current_class.level;
            casterLevels += levelBard;
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartBard + ((levelBard - 1) * hpBard);
            } else {
                sumHP += levelBard  * hpBard;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                bardCollege = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "cleric") {
            isCleric = 1;
            levelCleric = current_class.level;
            casterLevels += levelCleric;
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartCleric + ((levelCleric - 1) * hpCleric);
            } else {
                sumHP += levelCleric  * hpCleric;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                clericDomain = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "druid") {
            isDruid = 1;
            levelDruid = current_class.level;
            casterLevels += levelDruid;
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartDruid + ((levelDruid - 1) * hpDruid);
            } else {
                sumHP += levelDruid  * hpDruid;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                druidCircle = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "fighter") {
            isFighter = 1;
            levelFighter = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartFighter + ((levelFighter - 1) * hpFighter);
            } else {
                sumHP += levelFighter  * hpFighter;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                fighterArchetype = current_class.subclassDefinition.name;
                if(current_class.subclassDefinition.name == "Eldritch Knight") {
                    fighterSubclassEldritchKnight = 1;
                    casterLevels += Math.floor(levelFighter / 3);
                    casterClasses += 1;
                }
            }
        } else if (thisClass == "monk") {
            isMonk = 1;
            levelMonk = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartMonk + ((levelMonk - 1) * hpMonk);
            } else {
                sumHP += levelMonk  * hpMonk;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                monkWay = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "paladin") {
            isPaladin = 1;
            levelPaladin = current_class.level;
            casterLevels += Math.floor(levelPaladin / 2);
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartPaladin + ((levelPaladin - 1) * hpPaladin);
            } else {
                sumHP += levelPaladin  * hpPaladin;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                paladinOath = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "ranger") {
            isRanger = 1;
            levelRanger = current_class.level;
            casterLevels += Math.floor(levelRanger / 2);
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartRanger + ((levelRanger - 1) * hpRanger);
            } else {
                sumHP += levelRanger  * hpRanger;
            }
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                rangerArchtype = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "rogue") {
            isRogue = 1;
            levelRogue = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartRogue + ((levelRogue - 1) * hpRogue);
            } else {
                sumHP += levelRogue  * hpRogue;
            }
            if (current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                rogueArchetype = current_class.subclassDefinition.name;
                //console.log(rogueArchetype);
                if(rogueArchetype == "Arcane Trickster") {
                    rogueSubclassArcaneTrickster = 1;
                    casterLevels += Math.floor(levelRogue / 3);
                    casterClasses += 1;
                } else if (rogueArchetype.match(/Swashbuckler/)) {

                }
            }
        } else if (thisClass == "sorcerer") {
            isSorcerer = 1;
            levelSorcerer = current_class.level;
            casterLevels += levelSorcerer;
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartSorcerer + ((levelSorcerer - 1) * hpSorcerer);
            } else {
                sumHP += levelSorcerer  * hpSorcerer;
            }
            if (current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                sorcererOrigin = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "warlock") {
            isWarlock = 1;
            levelWarlock = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartWarlock + ((levelWarlock - 1) * hpWarlock);
            } else {
                sumHP += levelWarlock  * hpWarlock;
            }
            if (current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                warlockPatron = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "wizard") {
            isWizard = 1;
            levelWizard = current_class.level;
            casterLevels += levelWizard;
            casterClasses += 1;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartWizard + ((levelWizard - 1) * hpWizard);
            } else {
                sumHP += levelWizard  * hpWizard;
            }
            if (current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                wizardSchool = current_class.subclassDefinition.name;
            }
        } else if (thisClass == "blood hunter" || thisClass == "blood hunter (archived)") {
            isBloodHunter = 1;
            levelBloodHunter = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartBloodhunter + ((levelBloodHunter - 1) * hpBloodHunter);
            } else {
                sumHP += levelBloodHunter  * hpBloodHunter;
            }
            //console.log("sumHP: " + sumHP);
        } else if (thisClass == "artificer") {
            isArtificer = 1;
            levelArtificer = current_class.level;
            if (current_class.isStartingClass == true) {
                sumHP += hpStartArtificer + ((levelArtificer - 1) * hpArtificer);
            } else {
                sumHP += levelArtificer  * hpArtificer;
            }
        }
        totalClasses += 1;
        totalLevels += current_class.level;
        thisIteration = pad(i + 1, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<hddie type=\"dice\">";
        buildXML += "d" + current_class.definition.hitDice;
        buildXML += "</hddie>\n";
        buildXML += "\t\t\t\t<name type=\"string\">" + current_class.definition.name + "</name>\n";
        if(thisClass === "warlock") {
            buildXML += "\t\t\t\t<casterpactmagic type=\"number\">1</casterpactmagic>\n";
        } else {
            buildXML += "\t\t\t\t<casterpactmagic type=\"number\">0</casterpactmagic>\n";
        }
        if((thisClass == "bard") || (thisClass == "cleric") || (thisClass == "druid")  || (thisClass == "sorcerer") || (thisClass == "warlock")  || (thisClass == "wizard")  || (thisClass == "artificer")) {
            buildXML += "\t\t\t\t<casterlevelinvmult type=\"number\">1</casterlevelinvmult>\n";
        } else if ((thisClass == "paladin" || thisClass == "ranger") && current_class.level >= 2) {
            buildXML += "\t\t\t\t<casterlevelinvmult type=\"number\">2</casterlevelinvmult>\n";
        } else if ((thisClass == "rogue" || thisClass == "fighter") && current_class.level >= 3) {
            if(current_class.hasOwnProperty("subclassDefinition") && current_class.subclassDefinition != null) {
                if(current_class.subclassDefinition.name == "Arcane Trickster" || current_class.subclassDefinition.name == "Eldritch Knight") {
                    buildXML += "\t\t\t\t<casterlevelinvmult type=\"number\">3</casterlevelinvmult>\n";
                }
            }
        }
        buildXML += "\t\t\t\t<level type=\"number\">" + current_class.level + "</level>\n";
        buildXML += "\t\t\t\t<shortcut type=\"windowreference\">\n";
        buildXML += "\t\t\t\t\t<class>reference_class</class>\n";
        buildXML += "\t\t\t\t\t<recordname>reference.classdata." + thisClass.replace(/\s/g, "") + "@*</recordname>\n";
        buildXML += "\t\t\t\t</shortcut>\n";
        buildXML += `\t\t\t</id-${thisIteration}>\n`;

    });
    buildXML += "\t\t</classes>\n";

    if (isBarbarian == 1 && levelBarbarian >= 5 && usingHeavyArmor < 1) {
        addSpeed += 10;
    }

    charWalk = parseInt(character.race.weightSpeeds.normal.walk) + addSpeed;
    

    // baseHitPoints
    character.race.racialTraits.some(function(current_trait, i) {
        if(current_trait.definition.name == "Dwarven Toughness") {
            addHP = totalLevels;
        }
    });
    character.feats.some(function(current_feat, i) {
        if (current_feat.definition.name == "Tough") {
            addHP += (totalLevels * 2);
        }
    });
    if(isSorcerer == 1 && sorcererOrigin.match(/Draconic\sBloodline/)) {
        // Draconic Resilience adds 1 to HP
        addHP += levelSorcerer;
    }

    //if (character.preferences.hitPointType)
    // FIXME HP options
    //console.log(character.preferences.hitPointType);

    // 1 = Fixed, 2 = Manual
    if (character.preferences.hitPointType == "2") {
        totalHP = character.baseHitPoints + + ((Math.floor((getTotalAbilityScore(character, 3) - 10 ) / 2) * totalLevels))
    } else {
        //console.log("addHP: " + addHP + "; sumHP: " + sumHP);
        //console.log("totalLevels: " + (Math.floor((getTotalAbilityScore(character, 3) - 10 ) / 2)));
        totalHP = addHP + sumHP + Math.floor((getTotalAbilityScore(character, 3) - 10 ) / 2) * totalLevels;
    }

    buildXML += "\t\t<hp>\n";
    if(character.deathSaves.failCount != null) {
        buildXML += "\t\t\t<deathsavefail type=\"number\">" + character.deathSaves.failCount + "</deathsavefail>\n";
    } else {
        buildXML += "\t\t\t<deathsavefail type=\"number\">0</deathsavefail>\n";
    }
    if(character.deathSaves.successCount != null) {
        buildXML += "\t\t\t<deathsavesuccess type=\"number\">" + character.deathSaves.successCount + "</deathsavesuccess>\n";
    } else {
        buildXML += "\t\t\t<deathsavesuccess type=\"number\">0</deathsavesuccess>\n";
    }
    buildXML += `\t\t\t<total type="number">${totalHP}</total>\n`;
    buildXML += "\t\t</hp>\n";

    var languages = getCachedObjects(character, 'type', 'language');
    buildXML += "\t\t<languagelist>\n";
    languages.some(function(current_lang, i) {
        thisIteration = pad(i + 1, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<name type=\"string\">" + capitalizeFirstLetter(current_lang.subType) + "</name>\n";
        buildXML += `\t\t\t</id-${thisIteration}>\n`;
    });
    buildXML += "\t\t</languagelist>\n";

    character.race.racialTraits.some(function(current_trait) {
        if(current_trait.definition.name == "Darkvision") {
            buildXML += "\t\t<senses type=\"string\">Darkvision 60ft.</senses>\n";
        } else if(current_trait.definition.name == "Superior Darkvision") {
            buildXML += "\t\t<senses type=\"string\">Darkvision 120ft.</senses>\n";
        }
    });

    buildXML += "\t\t<traitlist>\n";
    character.race.racialTraits.some(function(current_trait, i) {
        switch (current_trait.definition.name) {
            case "Ability Score Increase": case "Age": case "Alignment": case "Size": case "Speed": case "Darkvision":
            case "Dwarven Combat Training": case "Tool Proficiency": case "Languages": case "Dwarven Toughness":
            case "Cantrip": case "Extra Language": case "Dwarven Armor Training": case "Skill Versatility":
                return;
            default:
                break;
        }
        thisIteration = pad(i + 1, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;

        // Drag/drop only lists name, not any snippet, so we've removed it.
        buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(current_trait.definition.name).trim() + "</name>\n";
        buildXML += "\t\t\t\t<source type=\"string\">" + convert_case(replaceDash(character.race.baseName.toLowerCase())) + "</source>\n";
        buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
        buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
        buildXML += "\t\t\t\t\t" + fixDesc(current_trait.definition.description) + "\n";
        buildXML += "\t\t\t\t</text>\n";
        buildXML += "\t\t\t\t<type type=\"string\">racial</type>\n";
        buildXML += `\t\t\t</id-${thisIteration}>\n`;
    });

    buildXML += "\t\t</traitlist>\n";

    totalFeatures = 0;
    // Performance timing: start features processing
    const featuresStartTime = performance.now();
    console.log(`Pre-features time: ${(featuresStartTime - skillsEndTime).toFixed(2)}ms`);
    
    buildXML += "\t\t<featurelist>\n";
    character.classes.some(function(current_class) {
        classLevel = current_class.level;
        current_class.definition.classFeatures.some(function(current_feature) {


            switch (current_feature.name) {
                case "Hit Points": case "Proficiencies": case "Martial Archetype": case "Fighting Style":
                case "Ability Score Improvement": case "Oath Spells": case "Spellcasting":
                case "Circle Spells": case "Bonus Cantrip": case "Bonus Proficiencies": case "Druidic":
                case "Expanded Spell List": case "Otherwordly Patron": case "Expanded Spell List":
                case "Acrobatics": case "Animal Handling": case "Arcana": case "Athletics": case "Deception":
                case "History": case "Intimidation": case "Investigation": case "Medicine": case "Nature":
                case "Perception": case "Performance": case "Persuasion": case "Religion": case "Sleight of Hand":
                case "Stealth": case "Survival": case "Divine Domain": case "Bonus Proficiency":
                    return;
                default:
                    break;
            }
            if(parseInt(current_feature.requiredLevel) <= parseInt(classLevel)) {
                if(holdFeatures.includes(current_feature.name)) {
                    //Skip this one, it's already in the array
                } else {
                    holdFeatures.push(current_feature.name);
                    totalFeatures += 1;
                    thisIteration = pad(totalFeatures, 5);
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(current_feature.name) + "</name>\n";
                    buildXML += "\t\t\t\t<source type=\"string\">" + convert_case(replaceDash(current_class.definition.name.toLowerCase())) + "</source>\n";
                    buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
                    buildXML += "\t\t\t\t\t" + fixDesc(current_feature.description) + "\n";
                    buildXML += "\t\t\t\t</text>\n";
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        });
        if(current_class.hasOwnProperty("subclassDefinition")) {
            if(current_class.subclassDefinition != null) {

                if(holdFeatures.includes(current_class.subclassDefinition.name)) {
                    // Skip this one, it's already in the array
                } else {
                    holdFeatures.push(current_class.subclassDefinition.name);
                    totalFeatures += 1;
                    thisIteration = pad(totalFeatures, 5);
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(current_class.subclassDefinition.name) + "</name>\n";
                    buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
                    buildXML += "\t\t\t\t\t" + fixDesc(current_class.subclassDefinition.description) + "\n";
                    buildXML += "\t\t\t\t</text>\n";
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
                current_class.subclassDefinition.classFeatures.some(function(charSubClass) {
                    switch (charSubClass.name) {
                        case "Hit Points": case "Proficiencies": case "Martial Archetype": case "Fighting Style":
                        case "Ability Score Improvement": case "Oath Spells":
                        case "Circle Spells": case "Bonus Cantrip": case "Bonus Proficiencies": case "Druidic":
                        case "Expanded Spell List": case "Otherwordly Patron": case "Expanded Spell List":
                        case "Acrobatics": case "Animal Handling": case "Arcana": case "Athletics": case "Deception":
                        case "History": case "Intimidation": case "Investigation": case "Medicine": case "Nature":
                        case "Perception": case "Performance": case "Persuasion": case "Religion": case "Sleight of Hand":
                        case "Stealth": case "Survival": case "Divine Domain": case "Bonus Proficiency":
                            return;
                        default:
                            break;
                    }
                    if(charSubClass.requiredLevel <= parseInt(classLevel)) {
                        if(holdFeatures.includes(charSubClass.name)) {
                            // Skip this one, it's already in the array
                        } else {
                            holdFeatures.push(charSubClass.name);
                            totalFeatures += 1;
                            thisIteration = pad(totalFeatures, 5);
                            buildXML += `\t\t\t<id-${thisIteration}>\n`;
                            buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
                            buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(charSubClass.name) + "</name>\n";
                            buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
                            buildXML += "\t\t\t\t\t" + fixDesc(charSubClass.description) + "\n";
                            buildXML += "\t\t\t\t</text>\n";
                            buildXML += `\t\t\t</id-${thisIteration}>\n`;
                        }
                    }
                });
            }
        }

    });
    const charOptions = character.options.class;
    if (charOptions != null) charOptions.some(function(thisOption) {
        switch (thisOption.definition.name) {
            case "Hit Points": case "Proficiencies": case "Martial Archetype": case "Fighting Style":
            case "Ability Score Improvement": case "Oath Spells":
            case "Circle Spells": case "Bonus Cantrip": case "Bonus Proficiencies": case "Druidic":
            case "Expanded Spell List": case "Otherwordly Patron": case "Expanded Spell List":
            case "Acrobatics": case "Animal Handling": case "Arcana": case "Athletics": case "Deception":
            case "History": case "Intimidation": case "Investigation": case "Medicine": case "Nature":
            case "Perception": case "Performance": case "Persuasion": case "Religion": case "Sleight of Hand":
            case "Stealth": case "Survival": case "Divine Domain": case "Bonus Proficiency":
                return;
            default:
                break;
        }
        totalFeatures += 1;
        thisIteration = pad(totalFeatures, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
        buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(thisOption.definition.name) + "</name>\n";
        buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
        buildXML += "\t\t\t\t\t" + fixDesc(thisOption.definition.description) + "\n";
        buildXML += "\t\t\t\t</text>\n";
        buildXML += `\t\t\t</id-${thisIteration}>\n`;
    });

    if (character.background.definition != null) {
        if (character.background.definition.featureName != null || (character.background.definition.featureName != "")) {
            totalFeatures += 1;
            thisIteration = pad(totalFeatures + 1, 5);
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(character.background.definition.featureName).trim() + "</name>\n";
            buildXML += "\t\t\t\t<source type=\"string\">" + convert_case(replaceDash(character.background.definition.name.toLowerCase())) + "</source>\n";
            buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
            buildXML += "\t\t\t\t\t" + fixDesc(character.background.definition.featureDescription) + "\n";
            buildXML += "\t\t\t\t</text>\n";
            buildXML += "\t\t\t\t<type type=\"string\">background</type>\n";
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
        }
    }

    buildXML += "\t\t</featurelist>\n";
    
    // Performance timing: features processing complete
    const featuresEndTime = performance.now();
    console.log(`Features processing time: ${(featuresEndTime - featuresStartTime).toFixed(2)}ms`);

    // Process all ability score bonuses from all sources before calculating final scores
    const abilityBonusStartTime = performance.now();
    processAbilityScoreBonuses(character);
    const abilityBonusEndTime = performance.now();
    console.log(`Ability score bonus processing time: ${(abilityBonusEndTime - abilityBonusStartTime).toFixed(2)}ms`);

    buildXML += "\t\t<abilities>\n";
    justAbilities.some(function(thisAbility, ja) {
        abilScore = parseInt(getTotalAbilityScore(character, ja + 1));
        if (abilScore > 20) {
            abilScore = 20;
        }
        modScore = parseInt(abilScore / 2) - 5;

        if(thisAbility == "strength") {
            strScore = abilScore;
            strMod = modScore;
        } else if(thisAbility == "dexterity") {
            dexScore = abilScore;
            dexMod = modScore;
        } else if(thisAbility == "constitution") {
            conScore = abilScore;
            conMod = modScore;
        } else if(thisAbility == "intelligence") {
            intScore = abilScore;
            intMod = modScore;
        } else if(thisAbility == "wisdom") {
            wisScore = abilScore;
            wisMod = modScore;
        } else if(thisAbility == "charisma") {
            chaScore = abilScore;
            chaMod = modScore;
        }
        buildXML += "\t\t\t<" + thisAbility + ">\n";
        buildXML += "\t\t\t\t<bonus type=\"number\">" + modScore + "</bonus>\n";

        buildXML += "\t\t\t\t<savemodifier type=\"number\">" + addSavingThrows + "</savemodifier>\n";
        character.modifiers.class.some(function(thisMod) {
            if(thisMod.subType == thisAbility + "-saving-throws") {
                buildXML += "\t\t\t\t<saveprof type=\"number\">1</saveprof>\n";
                // Set proficiency flag using object notation instead of eval
                window[thisAbility.substring(0,3) + 'Prof'] = 1;
            }
        });
        buildXML += "\t\t\t\t<score type=\"number\">" + abilScore + "</score>\n";
        buildXML += "\t\t\t</" + thisAbility + ">\n";
    });
    buildXML += "\t\t</abilities>\n";

    // Character Inventory
    var weaponList = [];
    var weaponID = [];
    var weaponName = [];
    var weaponProperties = [];
    var weaponDice = [];
    var weaponDiceMult = [];
    var weaponType = [];
    var weaponBonus = [];
    var weaponBase = [];

    // Performance timing: start inventory processing
    const inventoryStartTime = performance.now();
    console.log(`Pre-inventory processing time: ${(inventoryStartTime - parseStartTime).toFixed(2)}ms`);
    
    buildXML += "\t\t<inventorylist>\n";
    
    // Process nested inventory structure
    const inventoryState = {
        numBolts: numBolts,
        numArrows: numArrows, 
        numNeedles: numNeedles,
        numBullets: numBullets,
        weaponID: weaponID,
        weaponName: weaponName,
        weaponProperties: weaponProperties,
        weaponDice: weaponDice,
        weaponBase: weaponBase,
        weaponBonus: weaponBonus,
        weaponType: weaponType,
        weaponQuantity: [],
        strScore: strScore,
        dexScore: dexScore,
        fgVersion: fgVersion,
        usingShield: usingShield,
        wearingArmor: wearingArmor,
        usingHeavyArmor: usingHeavyArmor,
        usingMediumArmor: usingMediumArmor,
        usingLightArmor: usingLightArmor,
        addBonusArmorAC: addBonusArmorAC,
        addBonusOtherAC: addBonusOtherAC,
        addSavingThrows: addSavingThrows,
        simpleRangedWeapon: simpleRangedWeapon,
        simpleMeleeWeapon: simpleMeleeWeapon,
        martialRangedWeapon: martialRangedWeapon,
        martialMeleeWeapon: martialMeleeWeapon
    };
    
    const inventoryXML = processNestedInventoryXML(character.inventory, character.id.toString(), inventoryState);
    buildXML += inventoryXML;
    
    // Update counts and tracking variables from nested processing
    numBolts = inventoryState.numBolts;
    numArrows = inventoryState.numArrows;
    numNeedles = inventoryState.numNeedles;
    numBullets = inventoryState.numBullets;
    usingShield = inventoryState.usingShield;
    wearingArmor = inventoryState.wearingArmor;
    usingHeavyArmor = inventoryState.usingHeavyArmor;
    usingMediumArmor = inventoryState.usingMediumArmor;
    usingLightArmor = inventoryState.usingLightArmor;
    addBonusArmorAC = inventoryState.addBonusArmorAC;
    addBonusOtherAC = inventoryState.addBonusOtherAC;
    addSavingThrows = inventoryState.addSavingThrows;
    
    // Old inventory processing removed - now handled by processNestedInventoryXML above
    // Weapon tracking, armor calculations, and equipment processing is now handled in processNestedInventoryXML
    
    // Close the inventorylist section
    buildXML += "\t\t</inventorylist>\n";
    
    // Performance timing: inventory processing complete
    const inventoryEndTime = performance.now();
    console.log(`Inventory processing time: ${(inventoryEndTime - inventoryStartTime).toFixed(2)}ms`);

    buildXML += "\t\t<weaponlist>\n";
    var weaponCount = 0;
    var thrownCount = 0;
    for(x = 0; x < weaponID.length; x++) {
        weaponCount += 1;
        thisIteration = pad(x + 1, 5);
        inventNum = pad(parseInt(weaponID[x]), 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<shortcut type=\"windowreference\">\n";
        buildXML += "\t\t\t\t\t<class>item</class>\n";
        buildXML += "\t\t\t\t\t<recordname>....inventorylist.id-" + inventNum + "</recordname>\n";
        buildXML += "\t\t\t\t</shortcut>\n";
        buildXML += "\t\t\t\t<name type=\"string\">" + weaponName[x] + "</name>\n";
        buildXML += "\t\t\t\t<properties type=\"string\">" + weaponProperties[x] + "</properties>\n";
        buildXML += "\t\t\t\t<damagelist>\n";
        buildXML += "\t\t\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t\t\t<bonus type=\"number\">" +  weaponBonus[x] + "</bonus>\n";
        buildXML += "\t\t\t\t\t\t<dice type=\"dice\">" + weaponDice[x] + "</dice>\n";
        buildXML += "\t\t\t\t\t\t<stat type=\"string\">" + weaponBase[x] + "</stat>\n";
        buildXML += "\t\t\t\t\t\t<type type=\"string\">" + weaponType[x] + "</type>\n";
        buildXML += "\t\t\t\t\t</id-00001>\n";
        buildXML += "\t\t\t\t</damagelist>\n";
        
        // Add maxammo for ranged and thrown weapons
        if (weaponName[x] && weaponName[x].includes("Crossbow")) {
            buildXML += "\t\t\t\t<maxammo type=\"number\">" + numBolts + "</maxammo>\n";
        } else if (weaponName[x] && weaponName[x].includes("Sling")) {
            buildXML += "\t\t\t\t<maxammo type=\"number\">" + numBullets + "</maxammo>\n";
        } else if (weaponName[x] && weaponName[x].includes("Blowgun")) {
            buildXML += "\t\t\t\t<maxammo type=\"number\">" + numNeedles + "</maxammo>\n";
        } else if (weaponName[x] && (weaponName[x].includes("Shortbow") || weaponName[x].includes("Longbow"))) {
            buildXML += "\t\t\t\t<maxammo type=\"number\">" + numArrows + "</maxammo>\n";
        } else if (weaponProperties[x] && weaponProperties[x].match(/Thrown/)) {
            // For thrown weapons, use the weapon's own quantity as maxammo
            const weaponQuantity = inventoryState.weaponQuantity[x] || 1;
            buildXML += "\t\t\t\t<maxammo type=\"number\">" + weaponQuantity + "</maxammo>\n";
        } else if (weaponProperties[x] && weaponProperties[x].match(/Range/)) {
            // For other ranged weapons without specific ammunition, set maxammo to 1
            buildXML += "\t\t\t\t<maxammo type=\"number\">1</maxammo>\n";
        } 
        buildXML += "\t\t\t\t<attackbonus type=\"number\">" + weaponBonus[x] + "</attackbonus>\n";
        buildXML += "\t\t\t\t<attackstat type=\"string\">" + weaponBase[x] + "</attackstat>\n";
        buildXML += "\t\t\t\t<isidentified type=\"number\">1</isidentified>\n";
        // 0: Melee, 1: Ranged, 2: Thrown
        if(weaponProperties[x] && weaponProperties[x].match(/Thrown/)) {
            buildXML += "\t\t\t\t<type type=\"number\">2</type>\n";
        } else if(weaponProperties[x] && weaponProperties[x].match(/Range/)) {
            buildXML += "\t\t\t\t<type type=\"number\">1</type>\n";
        } else {
            buildXML += "\t\t\t\t<type type=\"number\">0</type>\n";
        }

        buildXML += `\t\t\t</id-${thisIteration}>\n`;
        if(weaponProperties[x] && weaponProperties[x].includes("Thrown")) {
            thrownCount += 1;
            weaponCount += 1;
            thisIteration = pad(weaponID.length + thrownCount, 5);
            // We need to add these to the end, providing a higher weaponID.length
            inventNum = pad(parseInt(weaponID[x]), 5);
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += "\t\t\t\t<shortcut type=\"windowreference\">\n";
            buildXML += "\t\t\t\t\t<class>item</class>\n";
            buildXML += "\t\t\t\t\t<recordname>....inventorylist.id-" + inventNum + "</recordname>\n";
            buildXML += "\t\t\t\t</shortcut>\n";
            buildXML += "\t\t\t\t<name type=\"string\">" + weaponName[x] + "</name>\n";
            buildXML += "\t\t\t\t<properties type=\"string\">" + weaponProperties[x] + "</properties>\n";
            buildXML += "\t\t\t\t<damagelist>\n";
            buildXML += "\t\t\t\t\t<id-00001>\n";
            buildXML += "\t\t\t\t\t\t<bonus type=\"number\">" +  weaponBonus[x] + "</bonus>\n";
            buildXML += "\t\t\t\t\t\t<dice type=\"dice\">" + weaponDice[x] + "</dice>\n";
            buildXML += "\t\t\t\t\t\t<stat type=\"string\">" + weaponBase[x] + "</stat>\n";
            buildXML += "\t\t\t\t\t\t<type type=\"string\">" + weaponType[x] + "</type>\n";
            buildXML += "\t\t\t\t\t</id-00001>\n";
            buildXML += "\t\t\t\t</damagelist>\n";
            buildXML += "\t\t\t\t<attackbonus type=\"number\">" + weaponBonus[x] + "</attackbonus>\n";
            buildXML += "\t\t\t\t<attackstat type=\"string\">" + weaponBase[x] + "</attackstat>\n";
            buildXML += "\t\t\t\t<isidentified type=\"number\">1</isidentified>\n";
            buildXML += "\t\t\t\t<type type=\"number\">0</type>\n";
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
        }
    }
    if (isMonk == 1) {
        weaponCount += 1;
        thisIteration = pad(weaponCount + 1, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += addMonkUnarmedStrike;
        buildXML += `\t\t\t</id-${thisIteration}>\n`;
    }
    buildXML += "\t\t</weaponlist>\n";

    buildXML += "\t\t<featlist>\n";
    const charFeats = character.feats;
    if (charFeats != null) charFeats.some(function(thisFeat, i) {
        thisIteration = pad(i + 1, 5);
        buildXML += `\t\t\t<id-${thisIteration}>\n`;
        buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
        //console.log(thisFeat.definition.name);
        if (thisFeat.definition.name == "Medium Armor Master" && dexScore >= 16 && usingMediumArmor == 1) {
            mamFeat = 1;
        } else if (thisFeat.definition.name == "Alert") {
            alertFeat = 1;
        } else  if (thisFeat.definition.name == "Mobile") {
            mobileFeat = 1;
        } else if (thisFeat.definition.name == "Observant") {
            obsFeat = 1;
        }
        buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(thisFeat.definition.name) + "</name>\n";
        buildXML += "\t\t\t\t<text type=\"formattedtext\">\n";
        buildXML += "\t\t\t\t\t" + fixDesc(thisFeat.definition.description) + "\n";
        buildXML += "\t\t\t\t</text>\n";
        buildXML += `\t\t\t</id-${thisIteration}>\n`;
    });
    buildXML += "\t\t</featlist>\n";

    if (mobileFeat == 1) {
        charWalk += 10;
    }

    buildXML += "\t\t<speed>\n";
    buildXML += "\t\t\t<base type=\"number\">" + parseInt(charWalk) + "</base>\n";
    buildXML += "\t\t\t<total type=\"number\">" + parseInt(charWalk) + "</total>\n";
    buildXML += "\t\t</speed>\n";

    
    //idCount = 1;
    //hasHalf = 0;
    //halfProf = false;
    //var halfprof2 = getObjects(character, 'type', 'half-proficiency');
    //for (var y in halfprof2) {
    //    console.log("Inside half proficiency");
    //    var hfprof2 = halfprof2[y];
    //    console.log(halfprof2[y]);
    //    var type2 = hfprof2.subType;
    //    if(type2 == "initiative") {
    //        halfProf = true;
    //        buildXML += "\t\t\t<initiative>\n";
    //        switch (totalLevels) {
    //            case 1: case 2: case 3: case 4:
    //                buildXML += "\t\t\t\t<misc type=\"number\">1</misc>\n";
    //                //buildXML += "\t\t\t\t<profbonus type=\"number\">2</profbonus>\n";
    //                break;
    //            case 5: case 6: case 7: case 8:
    //                buildXML += "\t\t\t\t<misc type=\"number\">1</misc>\n";
    //                //buildXML += "\t\t\t\t<profbonus type=\"number\">3</profbonus>\n";
    //                break;
    //            case 9: case 10: case 11: case 12:
    //                buildXML += "\t\t\t\t<misc type=\"number\">2</misc>\n";
    //                //buildXML += "\t\t\t\t<profbonus type=\"number\">4</profbonus>\n";
    //                break;
    //            case 13: case 14: case 15: case 16:
    //                buildXML += "\t\t\t\t<misc type=\"number\">2</misc>\n";
    //                //buildXML += "\t\t\t\t<profbonus type=\"number\">5</profbonus>\n";
    //                break;
    //            case 17: case 18: case 19: case 20:
    //                buildXML += "\t\t\t\t<misc type=\"number\">3</misc>\n";
    //                //buildXML += "\t\t\t\t<profbonus type=\"number\">6</profbonus>\n";
    //                break;
    //            default:
    //                buildXML += "\t\t\t\t<misc type=\"number\">0</misc>\n";
    //        }

    //        buildXML += "\t\t\t\t<temporary type=\"number\">0</temporary>\n";
    //        buildXML += "\t\t\t\t</initiative>\n";
    //    }
    //}

    switch (totalLevels) {
        case 1: case 2: case 3: case 4:
            buildXML += "\t\t\t\t<profbonus type=\"number\">2</profbonus>\n";
            profBonus = 2;
            break;
        case 5: case 6: case 7: case 8:
            buildXML += "\t\t\t\t<profbonus type=\"number\">3</profbonus>\n";
            profBonus = 3;
            break;
        case 9: case 10: case 11: case 12:
            buildXML += "\t\t\t\t<profbonus type=\"number\">4</profbonus>\n";
            profBonus = 4;
            break;
        case 13: case 14: case 15: case 16:
            buildXML += "\t\t\t\t<profbonus type=\"number\">5</profbonus>\n";
            profBonus = 5;
            break;
        case 17: case 18: case 19: case 20:
            buildXML += "\t\t\t\t<profbonus type=\"number\">6</profbonus>\n";
            profBonus = 6;
            break;
    }

    // Passive wisdom
    if (obsFeat == 1) {
        passWisBonus += 5;
    }
    //passWisBonus += wisMod;
    if (levelBard >= 2) {
        // Jack of all trades
        passWisBonus += Math.floor(profBonus / 2);
    }

    
    buildXML += "\t\t<perceptionmodifier type=\"number\">" + passWisBonus + "</perceptionmodifier>\n";

    // Initiative
    var computeInit = 0;
    if (alertFeat == 1) {
        computeInit += 5;
    }
    if (levelBard >= 2) {
        // It's not a flat out +1, it's half proficiency
        computeInit += Math.floor(profBonus / 2);
    }
    if (rogueArchetype.match(/Swashbuckler/) && levelRogue >= 3) {
        computeInit += chaMod;
    }
    buildXML += "\t\t<initiative>\n";
    if (alertFeat == 1 || levelBard >= 2 || (rogueArchetype.match(/Swashbuckler/) && levelRogue >= 3)) {
        buildXML += "\t\t\t<misc type=\"number\">" + computeInit + "</misc>\n";
    }
    buildXML += "\t\t</initiative>\n";

    totalProfs = 0;
    buildXML += "\t\t<proficiencylist>\n";
    var proficiencies = getObjects(character, 'type', 'proficiency');
    if(proficiencies != null) proficiencies.some(function(prof, i) {
        if (typeof prof.friendlySubtypeName == 'undefined') {
            //    console.log("Has friendly");
            //} else {
            //    console.log("Yup, found something here");
            //}
            //if(holdProf.includes(prof.friendlySubtypeName) || (prof.friendlySubtypeName).match(/Saving Throws/)) {
            //  FIXME: What is this?
            //  console.log("We got here");
            //}
        } else {
            if (prof.friendlySubtypeName && ((prof.friendlySubtypeName).match(/Saving\sThrows/) || holdProf.includes(prof.friendlySubtypeName))) {
                // Skip Saving Throws in proficiencies
            } else {
                switch (prof.friendlySubtypeName) {
                    case "Athletics": case "Acrobatics": case "Sleight of Hand": case "Stealth": case "Arcana": case "History": case "Investigation": case "Nature": case "Religion": case "Animal Handling": case "Insight": case "Medicine": case "Perception": case "Survival": case "Deception": case "Intimidation": case "Performance": case "Persuasion":
                        return;
                    default:
                        holdProf.push(prof.friendlySubtypeName);
                        thisIteration = pad(i + 1, 5);
                        totalProfs += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(prof.friendlySubtypeName) + "</name>\n";
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        }
    });

    buildXML += "\t\t</proficiencylist>\n";

    buildXML += "\t\t<exp type=\"number\">" + character.currentXp + "</exp>\n";
    if(character.age != null) buildXML += "\t\t<age type=\"string\">" + character.age + "</age>\n";
    buildXML += "\t\t<height type=\"string\">" + fixQuote(character.height) + "</height>\n";
    if(character.weight != null) buildXML += "\t\t<weight type=\"string\">" + character.weight + "</weight>\n";
    buildXML += "\t\t<gender type=\"string\">" + fixQuote(character.gender) + "</gender>\n";
    buildXML += "\t\t<size type=\"string\">" + character.race.size + "</size>\n";
    buildXML += "\t\t<deity type=\"string\">" + fixQuote(character.faith) + "</deity>\n";

    if (character.eyes != null) {
        hasAppear += 1;
    }
    if (character.hair != null) {
        hasAppear += 2;
    }
    if (character.skin != null) {
        hasAppear += 4;
    }

    if (hasAppear == 1) {
        buildXML += "\t\t<appearance type=\"string\">Eyes: " + fixQuote(character.eyes) + "</appearance>\n";
    } else if (hasAppear == 2) {
        buildXML += "\t\t<appearance type=\"string\">Hair: " + fixQuote(character.hair) + "</appearance>\n";
    } else if (hasAppear == 3) {
        buildXML += "\t\t<appearance type=\"string\">Eyes: " + fixQuote(character.eyes) + "\nHair: " + fixQuote(character.hair) + "</appearance>\n";
    } else if (hasAppear == 4) {
        buildXML += "\t\t<appearance type=\"string\">Skin: " + fixQuote(character.skin) + "</appearance>\n";
    } else if (hasAppear == 5) {
        buildXML += "\t\t<appearance type=\"string\">Eyes: " + fixQuote(character.eyes) + "\nSkin: " + fixQuote(character.skin) + "</appearance>\n";
    } else if (hasAppear == 6) {
        buildXML += "\t\t<appearance type=\"string\">Hair: " + fixQuote(character.hair) + "\nSkin: " + fixQuote(character.skin) + "</appearance>\n";
    } else if (hasAppear == 7) {
        buildXML += "\t\t<appearance type=\"string\">Eyes: " + fixQuote(character.eyes) + "\nHair: " + fixQuote(character.hair) + "\nSkin: " + fixQuote(character.skin) + "</appearance>\n";
    }

    pactSlots = 0;
    pactLevel = 0;
    character.classes.some(function(current_class) {
        charClass = current_class.definition.name.toLowerCase();
        if(charClass === "warlock") {
            pactSlots = getPactMagicSlots(current_class.level);
            pactLevel = current_class.level;
        } else {
            if (current_class.hasOwnProperty("subclassDefinition")) {
                if(current_class.subclassDefinition != null) {
                    getSpellSlots(charClass, current_class.level, current_class.subclassDefinition.name);
                } else {
                    getSpellSlots(charClass, current_class.level, null);
                }
            } else {
                getSpellSlots(charClass, current_class.level, null);
            }
        }
    });

    buildXML += "\t\t<powermeta>\n";
    buildXML += "\t\t\t<pactmagicslots1>\n";
    if(pactLevel <= 2) {
        buildXML += "\t\t\t\t<max type=\"number\">" + parseInt(pactSlots) + "</max>\n";
    } else {
        buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    }
    buildXML += "\t\t\t</pactmagicslots1>\n";
    buildXML += "\t\t\t<pactmagicslots2>\n";
    if((pactLevel <= 4) && (pactLevel > 2)) {
        buildXML += "\t\t\t\t<max type=\"number\">" + parseInt(pactSlots) + "</max>\n";
    } else {
        buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    }
    buildXML += "\t\t\t</pactmagicslots2>\n";
    buildXML += "\t\t\t<pactmagicslots3>\n";
    if((pactLevel <= 6) && (pactLevel > 4)) {
        buildXML += "\t\t\t\t<max type=\"number\">" + parseInt(pactSlots) + "</max>\n";
    } else {
        buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    }
    buildXML += "\t\t\t</pactmagicslots3>\n";
    buildXML += "\t\t\t<pactmagicslots4>\n";
    if((pactLevel <= 8) && (pactLevel > 6)) {
        buildXML += "\t\t\t\t<max type=\"number\">" + parseInt(pactSlots) + "</max>\n";
    } else {
        buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    }
    buildXML += "\t\t\t</pactmagicslots4>\n";
    buildXML += "\t\t\t<pactmagicslots5>\n";
    if((pactLevel <= 20) && (pactLevel > 8)) {
        buildXML += "\t\t\t\t<max type=\"number\">" + parseInt(pactSlots) + "</max>\n";
    } else {
        buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    }
    buildXML += "\t\t\t</pactmagicslots5>\n";
    buildXML += "\t\t\t<pactmagicslots6>\n";
    buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    buildXML += "\t\t\t</pactmagicslots6>\n";
    buildXML += "\t\t\t<pactmagicslots7>\n";
    buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    buildXML += "\t\t\t</pactmagicslots7>\n";
    buildXML += "\t\t\t<pactmagicslots8>\n";
    buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    buildXML += "\t\t\t</pactmagicslots8>\n";
    buildXML += "\t\t\t<pactmagicslots9>\n";
    buildXML += "\t\t\t\t<max type=\"number\">0</max>\n";
    buildXML += "\t\t\t</pactmagicslots9>\n";

    buildXML += "\t\t\t<spellslots1>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots1 + "</max>\n";
    buildXML += "\t\t\t</spellslots1>\n";
    buildXML += "\t\t\t<spellslots2>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots2 + "</max>\n";
    buildXML += "\t\t\t</spellslots2>\n";
    buildXML += "\t\t\t<spellslots3>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots3 + "</max>\n";
    buildXML += "\t\t\t</spellslots3>\n";
    buildXML += "\t\t\t<spellslots4>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots4 + "</max>\n";
    buildXML += "\t\t\t</spellslots4>\n";
    buildXML += "\t\t\t<spellslots5>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots5 + "</max>\n";
    buildXML += "\t\t\t</spellslots5>\n";
    buildXML += "\t\t\t<spellslots6>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots6 + "</max>\n";
    buildXML += "\t\t\t</spellslots6>\n";
    buildXML += "\t\t\t<spellslots7>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots7 + "</max>\n";
    buildXML += "\t\t\t</spellslots7>\n";
    buildXML += "\t\t\t<spellslots8>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots8 + "</max>\n";
    buildXML += "\t\t\t</spellslots8>\n";
    buildXML += "\t\t\t<spellslots9>\n";
    buildXML += "\t\t\t\t<max type=\"number\">" + charSpellSlots9 + "</max>\n";
    buildXML += "\t\t\t</spellslots9>\n";
    buildXML += "\t\t</powermeta>\n";

    buildXML += "\t\t<coins>\n";
    buildXML += "\t\t\t<slot1>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">" + character.currencies.pp + "</amount>\n";
    buildXML += "\t\t\t\t<name type=\"string\">PP</name>\n";
    buildXML += "\t\t\t</slot1>\n";
    buildXML += "\t\t\t<slot2>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">" + character.currencies.gp + "</amount>\n";
    buildXML += "\t\t\t\t<name type=\"string\">GP</name>\n";
    buildXML += "\t\t\t</slot2>\n";
    buildXML += "\t\t\t<slot3>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">" + character.currencies.ep + "</amount>\n";
    buildXML += "\t\t\t\t<name type=\"string\">EP</name>\n";
    buildXML += "\t\t\t</slot3>\n";
    buildXML += "\t\t\t<slot4>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">" + character.currencies.sp + "</amount>\n";
    buildXML += "\t\t\t\t<name type=\"string\">SP</name>\n";
    buildXML += "\t\t\t</slot4>\n";
    buildXML += "\t\t\t<slot5>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">" + character.currencies.cp + "</amount>\n";
    buildXML += "\t\t\t\t<name type=\"string\">CP</name>\n";
    buildXML += "\t\t\t</slot5>\n";
    buildXML += "\t\t\t<slot6>\n";
    buildXML += "\t\t\t\t<amount type=\"number\">0</amount>\n";
    buildXML += "\t\t\t</slot6>\n";
    buildXML += "\t\t</coins>\n";

    // Power Groups
    buildXML += "\t\t<powergroup>\n";
    //buildXML += "\t\t\t<id-00001>\n";
    //buildXML += "\t\t\t\t<name type=\"string\">Resistances</name>\n";
    //buildXML += "\t\t\t</id-00001>\n";
    //buildXML += "\t\t\t<id-00002>\n";
    //buildXML += "\t\t\t\t<name type=\"string\">Immunities</name>\n";
    //buildXML += "\t\t\t</id-00002>\n";

    if(isDruid == 1 || isCleric == 1 || isBard == 1) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">wisdom</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if(isSorcerer == 1 || isWarlock == 1) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">charisma</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if(isWizard == 1 || isArtificer == 1) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">intelligence</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if (isRanger == 1 && levelRanger >= 2) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">wisdom</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if (isPaladin == 1 && levelPaladin >= 2) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">charisma</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if (isRogue == 1 && rogueSubclassArcaneTrickster == 1) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">intelligence</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    } else if (isFighter == 1 && fighterSubclassEldritchKnight == 1) {
        buildXML += "\t\t\t<id-00001>\n";
        buildXML += "\t\t\t\t<name type=\"string\">Spells</name>\n";
        buildXML += "\t\t\t\t<stat type=\"string\">intelligence</stat>\n";
        buildXML += "\t\t\t\t<castertype type=\"string\">memorization</castertype>\n";
        buildXML += "\t\t\t</id-00001>\n";
    }

    buildXML += "\t\t</powergroup>\n";

    // Spells sourceId:
    //    1: Players Handbook?
    //    2: Players Handbook?
    //    3: Dungeon Masters Guide
    //    4: Xanathar's Guide to Everything

    // Activation (casting time)
    // activation.activationTime
    //    null
    //    1
    // activation.activationType
    //    null
    //    1: action

    //    3: bonus action
    //    4: reaction
    //    5: second
    //    6: minute
    //    7: hour
    //    8: day
    totalSpells = 0;
    var spellList = [];
    buildXML += "\t\t<powers>\n";
    character.spells.race.some(function(eachSpell, i) {
        if(!spellList.includes(eachSpell.definition.name)) {
            spellList.push(eachSpell.definition.name);
            totalSpells += 1;
            thisIteration = pad(totalSpells, 5);
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            castingTime = "";
            if(eachSpell.definition.activation.activationTime == null) {
                castingTime = "";
            } else {
                castingTime = eachSpell.definition.activation.activationTime;
            }
            if(eachSpell.definition.activation.activationType == null) {
                castingTime += "";
            } else if(eachSpell.definition.activation.activationType == 1) {
                castingTime += " action";
            } else if(eachSpell.definition.activation.activationType == 3) {
                castingTime += " bonus action";
            } else if(eachSpell.definition.activation.activationType == 4) {
                castingTime += " reaction";
            } else if(eachSpell.definition.activation.activationType == 5) {
                    castingTime += " second";
            } else if(eachSpell.definition.activation.activationType == 6) {
                castingTime += " minute";
            } else if(eachSpell.definition.activation.activationType == 7) {
                castingTime += " hour";
            } else if(eachSpell.definition.activation.activationType == 8) {
                castingTime += " day";
            }
            buildXML += "\t\t\t\t<castingtime type=\"string\">" + castingTime + "</castingtime>\n";

            // Components: 1: Verbal; 2: Somatic; 3: Material
            componentList = "";
            if(eachSpell.definition.components.indexOf(1) != -1) {
                componentList += "V, ";
            }
            if(eachSpell.definition.components.indexOf(2) != -1) {
                componentList += "S, ";
            }
            if(eachSpell.definition.components.indexOf(3) != -1) {
                componentList += "M (" + eachSpell.definition.componentsDescription + "), ";
            }
            componentList = componentList.trim().slice(0, -1);
            buildXML += "\t\t\t\t<components type=\"string\">" + componentList + "</components>\n";
            buildXML += "\t\t\t\t<description type=\"formattedtext\">\n";
            buildXML += "\t\t\t\t\t" + fixDesc(eachSpell.definition.description) + "\n";
            buildXML += "\t\t\t\t</description>\n";
            if(eachSpell.definition.duration.durationType == "Time") {
                buildXML += "\t\t\t\t<duration type=\"string\">" + eachSpell.definition.duration.durationInterval + " " + eachSpell.definition.duration.durationUnit + "</duration>\n";
            } else if(eachSpell.definition.duration.durationType == "Instantaneous") {
                buildXML += "\t\t\t\t<duration type=\"string\">Instantaneous</duration>\n";
            }
            buildXML += "\t\t\t\t<group type=\"string\">Spells</group>\n";
            buildXML += "\t\t\t\t<level type=\"number\">" + eachSpell.definition.level + "</level>\n";
            buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
            buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(eachSpell.definition.name) + "</name>\n";
            buildXML += "\t\t\t\t<prepared type=\"number\">0</prepared>\n";
            if (eachSpell.definition.ritual == true) {
                buildXML += "\t\t\t\t<ritual type=\"number\">1</ritual>\n";
            } else {
                buildXML += "\t\t\t\t<ritual type=\"number\">0</ritual>\n";
            }
            if(eachSpell.definition.range.origin == "Ranged") {
                buildXML += "\t\t\t\t<range type=\"string\">" + eachSpell.definition.range.rangeValue + "</range>\n";
            } else if(eachSpell.definition.range.origin == "Touch") {
                buildXML += "\t\t\t\t<range type=\"string\">Touch</range>\n";
            } else if(eachSpell.definition.range.origin == "Self") {
                buildXML += "\t\t\t\t<range type=\"string\">Self</range>\n";
            }
            buildXML += "\t\t\t\t<school type=\"string\">" + fixQuote(eachSpell.definition.school) + "</school>\n";
            if (payFlag == 1) {
                buildXML += "\t\t\t\t<parse type=\"number\">1</parse>\n";
            }
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
        }
    });
    character.spells.class.some(function(eachSpell, i) {
        //console.log(eachSpell.definition.name);
        if(!spellList.includes(eachSpell.definition.name)) {
            spellList.push(eachSpell.definition.name);
            totalSpells += 1;
            thisIteration = pad(totalSpells, 5);
            buildXML += `\t\t\t<id-${thisIteration}>\n`;

            castingTime = "";
            if(eachSpell.definition.activation.activationTime == null) {
                castingTime = "";
            } else {
                castingTime = eachSpell.definition.activation.activationTime;
            }
            if(eachSpell.definition.activation.activationType == null) {
                castingTime += "";
            } else if(eachSpell.definition.activation.activationType == 1) {
                castingTime += " action";
            } else if(eachSpell.definition.activation.activationType == 3) {
                castingTime += " bonus action";
            } else if(eachSpell.definition.activation.activationType == 4) {
                castingTime += " reaction";
            } else if(eachSpell.definition.activation.activationType == 5) {
                    castingTime += " second";
            } else if(eachSpell.definition.activation.activationType == 6) {
                castingTime += " minute";
            } else if(eachSpell.definition.activation.activationType == 7) {
                castingTime += " hour";
            } else if(eachSpell.definition.activation.activationType == 8) {
                castingTime += " day";
            }
            buildXML += "\t\t\t\t<castingtime type=\"string\">" + castingTime + "</castingtime>\n";
            // Components: 1: Verbal; 2: Somatic; 3: Material
            componentList = "";
            if(eachSpell.definition.components.indexOf(1) != -1) {
                componentList += "V, ";
            }
            if(eachSpell.definition.components.indexOf(2) != -1) {
                componentList += "S, ";
            }
            if(eachSpell.definition.components.indexOf(3) != -1) {
                componentList += "M (" + eachSpell.definition.componentsDescription + "), ";
            }
            componentList = componentList.trim().slice(0, -1);
            buildXML += "\t\t\t\t<components type=\"string\">" + componentList + "</components>\n";
            buildXML += "\t\t\t\t<description type=\"formattedtext\">\n";
            buildXML += "\t\t\t\t\t" + fixDesc(eachSpell.definition.description) + "\n";
            buildXML += "\t\t\t\t</description>\n";
            if(eachSpell.definition.duration.durationType == "Time") {
                buildXML += "\t\t\t\t<duration type=\"string\">" + eachSpell.definition.duration.durationInterval + " " + eachSpell.definition.duration.durationUnit + "</duration>\n";
            } else if(eachSpell.definition.duration.durationType == "Instantaneous") {
                buildXML += "\t\t\t\t<duration type=\"string\">Instantaneous</duration>\n";
            }
            buildXML += "\t\t\t\t<group type=\"string\">Spells</group>\n";
            buildXML += "\t\t\t\t<level type=\"number\">" + eachSpell.definition.level + "</level>\n";
            buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
            buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(eachSpell.definition.name) + "</name>\n";
            buildXML += "\t\t\t\t<prepared type=\"number\">0</prepared>\n";
            if (eachSpell.definition.ritual == true) {
                buildXML += "\t\t\t\t<ritual type=\"number\">1</ritual>\n";
            } else {
                buildXML += "\t\t\t\t<ritual type=\"number\">0</ritual>\n";
            }
            if(eachSpell.definition.range.origin == "Ranged") {
                buildXML += "\t\t\t\t<range type=\"string\">" + eachSpell.definition.range.rangeValue + "</range>\n";
            } else if(eachSpell.definition.range.origin == "Touch") {
                buildXML += "\t\t\t\t<range type=\"string\">Touch</range>\n";
            } else if(eachSpell.definition.range.origin == "Self") {
                buildXML += "\t\t\t\t<range type=\"string\">Self</range>\n";
            }
            buildXML += "\t\t\t\t<school type=\"string\">" + fixQuote(eachSpell.definition.school) + "</school>\n";
            if (payFlag == 1) {
                buildXML += "\t\t\t\t<parse type=\"number\">1</parse>\n";
            }
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
        }
    });

    character.classes.some(function(current_class, i) {
        for(var j in character.classSpells) {
            var spells = character.classSpells[j];
            if(character.classSpells[j].characterClassId == current_class.id) {
                character.classSpells[j].spells.some(function(spell) {
                    if(!spellList.includes(spell.definition.name)) {
                        //if(spell.prepared == true || spell.alwaysPrepared == true || spell.definition.level == 0 || spell.definition.ritual == true || isSorcerer == 1 || isRanger == 1 || isBard == 1 || rogueSubclassArcaneTrickster == 1 ||fighterSubclassEldritchKnight == 1) {
                        if(spell.prepared == true || spell.alwaysPrepared == true || spell.definition.level == 0 || isSorcerer == 1 || isRanger == 1 || isBard == 1 || rogueSubclassArcaneTrickster == 1 || fighterSubclassEldritchKnight == 1 || isWarlock == 1) {

                            spellList.push(spell.definition.name);
                            totalSpells += 1;
                            thisIteration = pad(totalSpells, 5);
                            buildXML += `\t\t\t<id-${thisIteration}>\n`;

                            castingTime = "";
                            if(spell.definition.activation.activationTime == null) {
                                castingTime = "";
                            } else {
                                castingTime = spell.definition.activation.activationTime;
                            }
                            if(spell.definition.activation.activationType == null) {
                                castingTime += "";
                            } else if(spell.definition.activation.activationType == 1) {
                                castingTime += " action";
                            } else if(spell.definition.activation.activationType == 3) {
                                castingTime += " bonus action";
                            } else if(spell.definition.activation.activationType == 4) {
                                castingTime += " reaction";
                            } else if(spell.definition.activation.activationType == 5) {
                                    castingTime += " second";
                            } else if(spell.definition.activation.activationType == 6) {
                                castingTime += " minute";
                            } else if(spell.definition.activation.activationType == 7) {
                                castingTime += " hour";
                            } else if(spell.definition.activation.activationType == 8) {
                                castingTime += " day";
                            }
                            buildXML += "\t\t\t\t<castingtime type=\"string\">" + castingTime + "</castingtime>\n";
                            // Components: 1: Verbal; 2: Somatic; 3: Material
                            componentList = "";
                            if(spell.definition.components.indexOf(1) != -1) {
                                componentList += "V, ";
                            }
                            if(spell.definition.components.indexOf(2) != -1) {
                                componentList += "S, ";
                            }
                            if(spell.definition.components.indexOf(3) != -1) {
                                componentList += "M (" + spell.definition.componentsDescription + ")* ";
                            }
                            componentList = componentList.trim().slice(0, -1);

                            buildXML += "\t\t\t\t<components type=\"string\">" + componentList + "</components>\n";
                            buildXML += "\t\t\t\t<description type=\"formattedtext\">\n";
                            buildXML += "\t\t\t\t\t" + fixDesc(spell.definition.description) + "\n";
                            buildXML += "\t\t\t\t</description>\n";
                            if(spell.definition.duration.durationType == "Time") {
                                buildXML += "\t\t\t\t<duration type=\"string\">" + spell.definition.duration.durationInterval + " " + spell.definition.duration.durationUnit + "</duration>\n";
                            } else if(spell.definition.duration.durationType == "Instantaneous") {
                                buildXML += "\t\t\t\t<duration type=\"string\">Instantaneous</duration>\n";
                            }
                            buildXML += "\t\t\t\t<group type=\"string\">Spells</group>\n";
                            buildXML += "\t\t\t\t<level type=\"number\">" + spell.definition.level + "</level>\n";
                            buildXML += "\t\t\t\t<locked type=\"number\">1</locked>\n";
                            buildXML += "\t\t\t\t<name type=\"string\">" + fixQuote(spell.definition.name) + "</name>\n";
                            buildXML += "\t\t\t\t<prepared type=\"number\">0</prepared>\n";
                            if (spell.definition.ritual == true) {
                                buildXML += "\t\t\t\t<ritual type=\"number\">1</ritual>\n";
                            } else {
                                buildXML += "\t\t\t\t<ritual type=\"number\">0</ritual>\n";
                            }
                            if(spell.definition.range.origin == "Ranged") {
                                buildXML += "\t\t\t\t<range type=\"string\">" + spell.definition.range.rangeValue + "</range>\n";
                            } else if(spell.definition.range.origin == "Touch") {
                                buildXML += "\t\t\t\t<range type=\"string\">Touch</range>\n";
                            } else if(spell.definition.range.origin == "Self") {
                                buildXML += "\t\t\t\t<range type=\"string\">Self</range>\n";
                            }
                            buildXML += "\t\t\t\t<school type=\"string\">" + fixQuote(spell.definition.school) + "</school>\n";
                            if (payFlag == 1) {
                                buildXML += "\t\t\t\t<parse type=\"number\">1</parse>\n";
                            }
                            buildXML += `\t\t\t</id-${thisIteration}>\n`;
                        }
                    }
                });
            }
        }
    });

    // Okay, let's get ready for the paid version
    if (payFlag == 1) {
        if (isTiefling == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addTiefHellResist;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
        }
        if (isBarbarian == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addBarbarianRage;
            buildXML += "\t\t\t\t<prepared type=\"number\">" + barbRages + "</prepared>\n";
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            if (levelBarbarian >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBarbarianDangerSense;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBarbarianRecklessAttack;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelBarbarian >= 7) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBarbarianFeralInstinct;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelBarbarian >= 9) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBarbarianBrutalCritical;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelBarbarian >= 11) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBarbarianRelentlessRage;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }

            if (levelBarbarian >= 3) {
                if (barbPrimalPath.match(/Totem\sWarrior/)) {
                    if (barbTotemSpirit == "Wolf") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianWolfTotemSpirit;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (barbTotemSpirit == "Eagle") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianEagleTotemSpirit;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (barbTotemSpirit == "Bear") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianBearTotemSpirit;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    }
                    if (barbBeastAspect == "Wolf") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianWolfBeastAspect;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (barbBeastAspect == "Eagle") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianEagleBeastAspect;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (barbBeastAspect == "Bear") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianBearBeastAspect;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    }
                    if (levelBarbarian >= 14) {
                        if (barbTotemAttune == "Bear") {
                            thisIteration = pad(totalSpells + 1, 5);
                                totalSpells += 1;
                                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                                buildXML += addBarbarianTotemicAttunement;
                                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                        }
                    }

                } else if (barbPrimalPath.match(/Berserker/)) {
                    if (levelBarbarian >= 6) {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianMindlessRage;
                        buildXML += "\t\t\t\t<prepared type=\"number\">" + barbRages + "</prepared>\n";
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    }
                    if (levelBarbarian >= 10) {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addBarbarianIntimidatingPresence;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    }
                }
            }
        } else if (isBard == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addBardicInspiration;
            if (chaMod < 1) {
                useMod = 1;
            } else {
                useMod = chaMod;
            }
            buildXML += "<prepared type=\"number\">" + useMod + "</prepared>\n";
            buildXML += "<source type=\"string\">Bard</source>\n";
            buildXML += `\t\t\t</id-${thisIteration}>\n`;

            if (levelBard >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBardJackOfAllTrades;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBardSongOfRest;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelBard >= 6) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addBardCountercharm;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
        } else if (isCleric == 1) {
            if (levelCleric >= 1) {
                if (clericDomain.match(/Life/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericCureWoundsLife;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Light/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericWardingFlare;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Tempest/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericWrathOfTheStorm;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Trickery/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericBlessingOfTheTrickster;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/War/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericWarPriest;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelCleric >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addClericTurnUndead;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (clericDomain.match(/Arcana/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericArcaneAbjuration;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Life/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericPreserveLife;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Light/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericRadianceOfDawn;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Nature/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericCharmAnimals;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelCleric >= 6) {
                if (clericDomain.match(/Life/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericBlessedHealer;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Nature/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDampenElements;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Trickery/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericCloakOfShadows;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelCleric >= 8) {
                if (clericDomain.match(/Death/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Forge/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Life/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Nature/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Order/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Tempest/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Trickery/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/War/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericDivineStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelCleric >= 17) {
                if (clericDomain.match(/Life/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericCureWoundsSupreme;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/Light/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericCoronaOfLight;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (clericDomain.match(/War/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addClericAvatarOfBattle;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isDruid == 1) {
            if (levelDruid >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addDruidWildShape;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (druidCircle.match(/Land/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidNaturalRecovery;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (druidCircle.match(/Moon/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidCombatWildShape;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelDruid >= 6) {
                if (druidCircle.match(/Land/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidLandStride;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (druidCircle.match(/Moon/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidPrimalStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelDruid >= 10) {
                if (druidCircle.match(/Land/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidNaturesWard;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelDruid >= 14) {
                if (druidCircle.match(/Land/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addDruidNaturesSanctuary;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isFighter == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addFighterSecondWind;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            if (fighterArchetype.match(/Battle/)) {
                character.options.class.some(function(battlemaster, p) {
                    bmmName = battlemaster.definition.name;
                    if (bmmName == "Feinting Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterFeintingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Riposte") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterRiposte;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Commander's Strike") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterCommandersStrike;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Disarming Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterDisarmingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Distracting Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterDistractingStrike;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Goading Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterGoadingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Lunging Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterLungingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Maneuvering Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterManeuveringAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Menacing Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterMenacingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Precision Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterPrecisionAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Pushing Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterPushingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Rally") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterRally;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Sweeping Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterSweepingAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    } else if (bmmName == "Trip Attack") {
                        thisIteration = pad(totalSpells + 1, 5);
                        totalSpells += 1;
                        buildXML += `\t\t\t<id-${thisIteration}>\n`;
                        buildXML += addFighterTripAttack;
                        buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    }
                });
            }
            if (levelFighter >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addFighterActionSurge;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelFighter >= 3) {
                if (fighterArchetype.match(/Battle/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterCombatSuperiority;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelFighter >= 7) {
                if (fighterArchetype.match(/Purple/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterRoyalEnvoy;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (fighterArchetype.match(/Champion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterRemarkableAthlete;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelFighter >= 9) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addFighterIndomitable;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (fighterArchetype.match(/Purple/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterRallyingCry;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelFighter >= 10) {
                if (fighterArchetype.match(/Eldritch/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterEldritchStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelFighter >= 18) {
                if (fighterArchetype.match(/Purple/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addFighterSurvivor;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isMonk == 1) {
            if (monkWay.match(/Elements/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkFangsOfTheFireSnake;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkFistOfUnbrokenAir;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkWaterWhip;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            } else if (monkWay.match(/Death/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkTouchOfDeath;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            } else if (monkWay.match(/Soul/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkRadiantSunBolt;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkKi;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkFlurryOfBlows;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkPatientDefense;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkStepOfTheWind;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 4) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkSlowFall;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 5) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkStunningStrike;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 6) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkWholenessOfBody;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (monkWay.match(/Shadow/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addMonkShadowStep;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (monkWay.match(/Death/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addMonkHourOfReaping;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelMonk >= 7) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkEvasion;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 10) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkPurityOfBody;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelMonk >= 11) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkTranquility;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (monkWay.match(/Shadow/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addMonkCloakOfShadows;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelMonk >= 17) {
                if (monkWay.match(/Death/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addMonkTouchOfTheLongDeath;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (monkWay.match(/Soul/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addMonkSunShield;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelMonk >= 18) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addMonkEmptyBody;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
        } else if (isPaladin == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addPaladinDivineSense;
            buildXML += "<prepared type=\"number\">" + (chaMod + 1) + "</prepared>\n";
            buildXML += addPaladinDivineSense01;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addPaladinLayOnHands01;
            buildXML += "<prepared type=\"number\">" + (levelPaladin * 5) + "</prepared>\n";
            buildXML += addPaladinLayOnHands02;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            if (levelPaladin >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addPaladinDivineSmite;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelPaladin >= 3) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addPaladinDivineHealth;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
                if (paladinOath.match(/Crown/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinChampionChallengeCrown;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinTurnTheTideCrown;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Devotion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinSacredWeaponDevotion;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinTurnTheUnholyDevotion;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Ancients/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinNaturesWrathAncients;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinTurnTheFaithlessAncients;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Vengeance/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinAbjureEnemyVengeance;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinVowOfEnmityVengeance;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelPaladin >= 6) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addPaladinAuraOfProtection;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelPaladin >= 7) {
                if (paladinOath.match(/Devotion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinAuraOfDevotion;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Ancients/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinAuraOfWarding;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelPaladin >= 10) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addPaladinAuraOfCourage;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelPaladin >= 11) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addPaladinImprovedDivineSmite;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelPaladin >= 15) {
                if (paladinOath.match(/Crown/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinUnyieldingSpirit;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Devotion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinPurityOfSpirit;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Ancients/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinUndyingSentinal;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelPaladin >= 20) {
                if (paladinOath.match(/Vengeance/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinExaltedChampion;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Devotion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinHolyNimbus;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Ancients/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinElderChampion;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (paladinOath.match(/Ancients/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addPaladinAvengingAngel;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isRanger == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addRangerFavoredEnemy;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;

            if (levelRanger >= 3) {
                if (rangerArchtype.match(/Hunter/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRangerColossusSlayer;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelRanger >= 7) {
                if (rangerArchtype.match(/Hunter/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRangerDefensiveTactics;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelRanger >= 8) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addRangerLandsStride;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelRanger >= 10) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addRangerHideInPlainSight;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelRanger >= 15) {
                if (rangerArchtype.match(/Hunter/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRangerSuperiorHuntersDefense;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelRanger >= 18) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addRangerFeralSenses;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelRanger >= 20) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addRangerFoeSlayer;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
        } else if (isRogue == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addRogueSneakAttack01;
            switch (levelRogue) {
                case 1: case 2: 
                    buildXML += "\t\t<label type=\"string\">DMG: 1d6</label>\n";
                    break;
                case 3: case 4: 
                    buildXML += "\t\t<label type=\"string\">DMG: 2d6</label>\n";
                    break;
                case 5: case 6: 
                    buildXML += "\t\t<label type=\"string\">DMG: 3d6</label>\n";
                    break;
                case 7: case 8: 
                    buildXML += "\t\t<label type=\"string\">DMG: 4d6</label>\n";
                    break;
                case 9: case 10: 
                    buildXML += "\t\t<label type=\"string\">DMG: 5d6</label>\n";
                    break;
                case 11: case 12: 
                    buildXML += "\t\t<label type=\"string\">DMG: 6d6</label>\n";
                    break;
                case 13: case 14: 
                    buildXML += "\t\t<label type=\"string\">DMG: 7d6</label>\n";
                    break;
                case 15: case 16: 
                    buildXML += "\t\t<label type=\"string\">DMG: 8d6</label>\n";
                    break;
                case 17: case 18: 
                    buildXML += "\t\t<label type=\"string\">DMG: 9d6</label>\n";
                    break;
                case 19: case 20: 
                    buildXML += "\t\t<label type=\"string\">DMG: 10d6</label>\n";
                    break;
                default:
                    buildXML += "\t\t<label type=\"string\">DMG: 1d6</label>\n";
            }
            buildXML += addRogueSneakAttack02;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            if (levelRogue >= 3) {
                if (rogueArchetype.match(/Swashbuckler/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRogueRakishAudacity;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelRogue >= 7) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addRogueEvasion;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelRogue >= 9) {
                if (rogueArchetype.match(/Swashbuckler/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRoguePanache;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (rogueArchetype.match(/Trickster/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRogueMagicalAmbush;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelRogue >= 13) {
                if (rogueArchetype.match(/Swashbuckler/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRogueElegantManeuver;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (rogueArchetype.match(/Trickster/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRogueVersatileTrickster;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }

            }
            if (levelRogue >= 17) {
                if (rogueArchetype.match(/Assassin/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addRogueDeathStrike;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isSorcerer == 1) {
            if (sorcererOrigin.match(/Draconic/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addSorcererDragonAncestor;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            } else if (sorcererOrigin.match(/Wild/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addSorcererTidesOfChaos;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelSorcerer >= 2) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addSorcererFontOfMagic;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelSorcerer >= 6) {
                if (sorcererOrigin.match(/Storm/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addSorcererHeartOfTheStorm;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (sorcererOrigin.match(/Draconic/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addSorcererElementalAffinity;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelSorcerer >= 14) {
                if (sorcererOrigin.match(/Storm/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addSorcererStormsFury;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelSorcerer >= 18) {
                if (sorcererOrigin.match(/Storm/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addSorcererWindSoul;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (sorcererOrigin.match(/Draconic/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addSorcererDraconicPresence;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isWarlock == 1) {
            if (warlockPatron.match(/Archfey/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addWarlockFeyPresence;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            } else if (warlockPatron.match(/Fiend/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addWarlockDarkOnesBlessing;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            } else if (warlockPatron.match(/Undying/)) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addWarlockAmongTheDead;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelWarlock >= 6) {
                if (warlockPatron.match(/Archfey/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockMistyEscape;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Fiend/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockDarkOnesOwnLuck;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Great/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockEntropicWard;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Undying/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockDefyDeath;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWarlock >= 10) {
                if (warlockPatron.match(/Archfey/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockBeguilingDefenses;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Fiend/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockFiendishResilience;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Great/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockThoughtShield;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWarlock >= 14) {
                if (warlockPatron.match(/Archfey/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockDarkDelirium;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Fiend/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockHurlThroughHell;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Great/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockCreateThrall;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (warlockPatron.match(/Undying/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWarlockIndestructibleLife;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWarlock >= 11) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addWarlockMysticArcanum;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
            if (levelWarlock >= 20) {
                thisIteration = pad(totalSpells + 1, 5);
                totalSpells += 1;
                buildXML += `\t\t\t<id-${thisIteration}>\n`;
                buildXML += addWarlockEldritchMaster;
                buildXML += `\t\t\t</id-${thisIteration}>\n`;
            }
        } else if (isWizard == 1) {
            thisIteration = pad(totalSpells + 1, 5);
            totalSpells += 1;
            buildXML += `\t\t\t<id-${thisIteration}>\n`;
            buildXML += addWizardArcaneRecovery;
            buildXML += `\t\t\t</id-${thisIteration}>\n`;
            if (levelWizard >= 2) {
                if (wizardSchool.match(/Abjuration/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardArcaneWard;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Divination/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardPortent;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Enchantment/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardHypnoticGaze;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Necromancy/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardGrimHarvest;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }  else if (wizardSchool.match(/Bladesinging/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardBladesong;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWizard >= 6) {
                if (wizardSchool.match(/Conjuration/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardBenignTransposition;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Enchantment/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardInstinctiveCharm;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Transmutation/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardTransmutersStone;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWizard >= 10) {
                if (wizardSchool.match(/Abjuration/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardImprovedAbjuration;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Evocation/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardEmpoweredEvocation;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Illusion/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardIllusorySelf;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Necromancy/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardInuredToDeath;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Transmutation/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardShapechanger;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
            if (levelWizard >= 14) {
                if (wizardSchool.match(/Abjuration/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardSpellResistance;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Conjuration/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardDurableSummons;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Enchantment/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardAlterMemories;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Evocation/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardOverchannel;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Necromancy/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardCommandUndead;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                } else if (wizardSchool.match(/Bladesinging/)) {
                    thisIteration = pad(totalSpells + 1, 5);
                    totalSpells += 1;
                    buildXML += `\t\t\t<id-${thisIteration}>\n`;
                    buildXML += addWizardSongOfVictory;
                    buildXML += `\t\t\t</id-${thisIteration}>\n`;
                }
            }
        } else if (isArtificer == 1) {
            // Add Artificer effects here
        }
    }

    buildXML += "\t\t</powers>\n";

    baseAC = 0;
    shieldYes = 0;
    shieldAC = 0;
    dexBonus = 10;
    armDis = 0;
    armShieldProf = 0;
    // max2DexArmor
    // max3DexArmor (Medium Armor Master?)
    // fullDexArmor
    // noDexArmor
    character.inventory.some(function(eachInventory, i) {
        if(eachInventory.definition.filterType == "Armor") {
            if(eachInventory.equipped == true) {
                baseAC += eachInventory.definition.armorClass;
                if(eachInventory.definition.type == "Shield") {
                    shieldYes = 1;
                    shieldAC = eachInventory.definition.armorClass;
                    baseAC -= shieldAC;
                    if(holdProf.includes("Shields")) {
                        // Shield is proficient
                    } else {
                        armShieldProf -= 1;
                    }
                } else {
                    if(eachInventory.definition.stealthCheck == 2) {
                        armDis = 1;
                    }
                    thisArmor = eachInventory.definition.name.toLowerCase().replace(/\s/g, "_").replace(/-/g, "_");
                    if(noDexArmor.includes(thisArmor)) {
                        dexBonus = 0;
                        if(holdProf.includes("Heavy Armor")) {
                            // Proficient in heavy armor
                        } else {
                            armShieldProf -= 1;
                        }
                    } else if(max2DexArmor.includes(thisArmor)) {
                        if(dexBonus > 2) {
                            dexBonus = 2;
                        }
                        if(holdProf.includes("Medium Armor")) {
                            // Proficient in medium armor
                        } else {
                            armShieldProf -= 1;
                        }
                    } else if(max3DexArmor.includes(thisArmor)) {
                        if(dexBonus > 3) {
                            dexBonus = 3;
                        }
                    } else if(fullDexArmor.includes(thisArmor)) {
                        if(dexBonus > 4) {
                            dexBonus = 4;
                        }
                        if(holdProf.includes("Light Armor")) {
                            // Proficient in light armor
                        } else {
                            armShieldProf -= 1;
                        }
                    }
                }
            }
        }
    });

    // We need to figure out dex bonus: full, max 3, max 2, none
    buildXML += "\t\t<defenses>\n";
    buildXML += "\t\t\t<ac>\n";
    if(baseAC == 0) {
        baseAC += 10;
    }
    buildXML += "\t\t\t\t<armor type=\"number\">" + (baseAC - 10) + "</armor>\n";
    if (mamFeat == 1) {
        dexBonus = 3;
    }
    switch(dexBonus) {
        case 0:
            buildXML += "\t\t\t\t<dexbonus type=\"string\">no</dexbonus>\n";
            break;
        case 2:
            buildXML += "\t\t\t\t<dexbonus type=\"string\">max2</dexbonus>\n";
            break;
        case 3:
            buildXML += "\t\t\t\t<dexbonus type=\"string\">max3</dexbonus>\n";
            break;
    }
    if(isSorcerer == 1 && wearingArmor == 0 && usingShield == 0) {
        buildXML += "\t\t\t\t<misc type=\"number\">" + (3 + addBonusOtherAC) + "</misc>\n";
    } else {
        buildXML += "\t\t\t\t<misc type=\"number\">" + (addBonusArmorAC + addBonusOtherAC) + "</misc>\n";
    }
    if(armDis == 1 && mamFeat == 0) {
        buildXML += "\t\t\t\t<disstealth type=\"number\">1</disstealth>\n";
    }
    if(isMonk == 1 && wearingArmor == 0 && usingShield == 0) {
        buildXML += "\t\t\t\t<stat2 type=\"string\">wisdom</stat2>\n";
    }
    if(isBarbarian == 1 && wearingArmor == 0) {
        buildXML += "\t\t\t\t<stat2 type=\"string\">constitution</stat2>\n";
    }
    if(armShieldProf < 0) {
        buildXML += "\t\t\t\t<prof type=\"number\">0</prof>\n";
    } else {
        buildXML += "\t\t\t\t<prof type=\"number\">1</prof>\n";
    }
    if(shieldYes == 1) {
        buildXML += "\t\t\t\t<shield type=\"number\">" + shieldAC + "</shield>\n";
    }

    buildXML += "\t\t\t\t<temporary type=\"number\">0</temporary>\n";
    buildXML += "\t\t\t</ac>\n";
    buildXML += "\t\t</defenses>\n";

    buildXML += "\t\t<notes type=\"string\">";
    var allNotes = "";
    allNotes += "D" + "&amp;" + "D Beyond Character ID: " + $("#getcharID").val().trim() + "\\n";
    if (character.hasOwnProperty("notes")) {
        
        //console.log("We found notes.");
        $.each(character.notes, function(index, value) {
            if (value != null) {
                allNotes += index.charAt(0).toUpperCase() + index.substring(1) + ": " + fixDesc(value).trim() + "\\n";
            }
            //console.log(index + "; " +value);
        });
        //console.log(allNotes);
        buildXML += allNotes;
    }
    buildXML += "\t\t</notes>\n";

    allXML += buildXML + endXML;
    $('#textHere').val(allXML);
    
    // Performance timing: parseCharacter function complete
    const parseEndTime = performance.now();
    const totalParseTime = parseEndTime - parseStartTime;
    console.log(`Final XML assembly time: ${(parseEndTime - inventoryEndTime).toFixed(2)}ms`);
    console.log(`Total parseCharacter time: ${totalParseTime.toFixed(2)}ms`);
    console.log('=== Character Processing Complete ===');
    
    // Performance summary table
    console.table({
        'Basic Setup': `${(setupTime - parseStartTime).toFixed(2)}ms`,
        'Pre-Skills Processing': `${(skillsStartTime - setupTime).toFixed(2)}ms`,
        'Skills Processing': `${(skillsEndTime - skillsStartTime).toFixed(2)}ms`, 
        'Pre-Features Processing': `${(featuresStartTime - skillsEndTime).toFixed(2)}ms`,
        'Features Processing': `${(featuresEndTime - featuresStartTime).toFixed(2)}ms`,
        'Pre-Inventory Processing': `${(inventoryStartTime - featuresEndTime).toFixed(2)}ms`,
        'Inventory Processing': `${(inventoryEndTime - inventoryStartTime).toFixed(2)}ms`,
        'Final Assembly': `${(parseEndTime - inventoryEndTime).toFixed(2)}ms`,
        'Total Parse Time': `${totalParseTime.toFixed(2)}ms`
    });

    // 3163468 (Expertise: Double proficiency in Arcana)
    //var exp = getObjects(character, 'type', 'expertise');
    //for(var i in exp) {
    //    var expertise = exp[i];
    //    var pickles = expertise.subType.replace(/-/g, '_');
    //    //console.log(pickles);
    //}
    // characterValues
    // typeId: 26 (updating proficiency for a skill)
    // value: 0 (No selection); 1 (Not Proficient); 2 (Half-Proficient); 3 (Proficient); 4 (Expertise)
    // valueId: 3-Acrobatics; 11-Animal Handling; 6-Arcana; 2-Athletics; 16-Deception; 7-History; 12-Insight
    // valudId: 17-Intimidation; 8-Investigation; 13-Medicine; 9-Nature; 14-Perception; 18-Performance
    // valueId: 19-Persuasion; 10-Religion; 4-Sleight of Hand; 5-Stealth; 15-Survival
    // 2: Athletics
    // 3: Acrobatics
    // 4: Sleight of Hand
    // 5: Stealth
    // 6: Arcana
    // 7: History
    // 8: Investigation
    // 9: Nature
    // 10: Religion
    // 11: Animal Handling
    // 12: Insight
    // 13: Medicine
    // 14: Perception
    // 15: Survival
    // 16: Deception
    // 17: Intimidation
    // 18: Performance
    // 19: Persuasion
}

}

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make character parsing functions globally available for use by other scripts
if (typeof window !== 'undefined') {
    // Main character parsing function
    window.parseCharacter = parseCharacter;
}
