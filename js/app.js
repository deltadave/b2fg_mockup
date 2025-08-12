/*jshint esversion: 6 */
/*jshint multistr: true */

/* Original script by:
      Skype: RobinKuiper.eu
      Discord: Atheos#1095
      Roll20: https://app.roll20.net/users/1226016/robin
      Reddit: https://www.reddit.com/user/robinkuiper/
      Patreon: https://www.patreon.com/robinkuiper

    Further modifications by Matt DeKok
       Discord: Sillvva#2532
       Roll20: https://app.roll20.net/users/494585/sillvva
       Github: https://github.com/sillvva/Roll20APIScripts

    Fantasy Ground adaptation by David Berkompas
       Skype: david.berkompas
       Discord: BoomerET#2354
       Fantasy Grounds: BoomerET
       Github: https://github.com/BoomerET
       Reddit: https://www.reddit.com/user/BoomerET
       Roll20: https://app.roll20.net/users/9982/boomeret
       Paypal.me: https://paypal.me/boomeret
       (All contributions are donated to Hospice,
          or go here: https://www.hollandhospice.org/giving/donate-now/)

    Continued Fantasy Grounds development by Dave Lockwood
        discord: deltadave#5142
        Github: https://github.com/deltadave/
*/


// =============================================================================
// APPLICATION STATE MOVED TO APPSTATE.JS
// =============================================================================

// All application state variables moved to appState.js including:
// - XML generation state (startXML, allXML, pcFilename)
// - Character data tracking (payFlag, addHP, holdFeatures, etc.)
// - Class identification flags (isArtificer, isBarbarian, etc.)
// - Race identification flags (isDragonborn, isDwarf, etc.)
// - Level tracking by class (levelBarbarian, levelBard, etc.)
// - Subclass and archetype tracking (barbPrimalPath, bardCollege, etc.)
// - Equipment and combat state (wearingArmor, numArrows, etc.)
// - Ability scores and modifiers (strScore, strMod, etc.)
// - Spell slot state (charSpellSlots1-9)
// - Feat and feature flags (mamFeat, alertFeat, etc.)
// - Miscellaneous state (totalLevels, totalHP, fgVersion, etc.)

/* * * * * * * * * * */

$(function() {

    $("#grabChar").jqxButton({ width: "200px", height: "35px", theme: "darkblue" });
    $("#textHere").jqxTextArea({ theme: "darkblue", width: 750, height: 150, placeHolder: "XML will appear here." });
    $("#getcharID").jqxInput({ placeHolder: "Enter Character ID", height: "35px", width: 200, minLength: 4, theme: "darkblue"});
    $("#dlChar").jqxButton({ width: "150px", height: "35px", theme: "darkblue" });
    $("#resetChar").jqxButton({ width: "120px", height: "35px", theme: "darkblue" });
/*   $("#jqxMenu").jqxMenu({ width: 95, height: "145px", mode: "vertical", theme: "darkblue"});*/
    $("#jqxMenu").css("visibility", "visible");

    $('#goHome').click((e) => {
        e.preventDefault();
        window.location.reload(false);
    });
    $('#contactUs').click((e) => {
        e.preventDefault();
        window.open("https://docs.google.com/forms/d/1OTSE0zUqEcq14Epyp73YVHM9AavhI0uvtH1NeoRoKiA/edit", "_blank");
    });

    $('#grabChar').on("click", () => {
        // Enhanced secure character ID validation
        const charIdValidation = validateCharacterID($('#getcharID').val());
        if (!charIdValidation.valid) {
            showSecureNotification("Invalid Character ID: " + charIdValidation.error, 'error');
            return;
        }
        
        // Use the sanitized character ID
        $('#getcharID').val(charIdValidation.sanitized);
        
        if ($('#textHere').val() != "")  {
            var resetMe = confirm("You need to clear previous data, do you want me to do that for you?");
            if (resetMe == 1) {
                window.location.reload(false);
            }
        } else {
            if (!DEBUG) {
                //const proxyurl = "https://api.allorigins.win/raw?url=";
                //const proxyurl = "";
                const proxyurl = "https://uakari-indigo.fly.dev/";
                const charID = $('#getcharID').val().trim();
                const url = "https://character-service.dndbeyond.com/character/v5/character/";
                const fetchurl = proxyurl + url + charID;
                console.log(fetchurl);
                let headers = new Headers()
                headers.append('Accept', 'application/json');
                headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                //headers.append('Origin','http://www.beyond2fgconvert.com/');
                //headers.append('Access-Control-Allow-Origin', '*');
            
                
                // Performance baseline: start timing
                const performanceStart = performance.now();
                
                fetch(fetchurl, {
                    method: 'GET',
                    headers: headers
                })
                    .then(response => {
                        if (!response.ok) {
                            // Create specific error messages based on HTTP status codes
                            let statusMessage = '';
                            switch(response.status) {
                                case 404:
                                    statusMessage = 'Character not found. Please verify the Character ID and ensure the character is set to Public.';
                                    break;
                                case 403:
                                    statusMessage = 'Access denied. Please ensure the character is set to Public, not Private.';
                                    break;
                                case 429:
                                    statusMessage = 'Too many requests. Please wait a moment and try again.';
                                    break;
                                case 500:
                                case 502:
                                case 503:
                                    statusMessage = 'D&D Beyond servers are experiencing issues. Please try again in a few minutes.';
                                    break;
                                default:
                                    statusMessage = `Unable to fetch character data (Error ${response.status}). Please try again.`;
                            }
                            throw new Error(statusMessage);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Performance baseline: API fetch complete
                        const apiFetchTime = performance.now();
                        console.log(`API fetch time: ${(apiFetchTime - performanceStart).toFixed(2)}ms`);
                        
                        // Start character processing timing
                        const processingStart = performance.now();
                        parseCharacter(data);
                        
                        // Performance baseline: character processing complete
                        const processingEnd = performance.now();
                        const totalTime = processingEnd - performanceStart;
                        const processTime = processingEnd - processingStart;
                        
                        console.log(`Character processing time: ${processTime.toFixed(2)}ms`);
                        console.log(`Total conversion time: ${totalTime.toFixed(2)}ms`);
                        
                        // Show performance summary to user
                        showSecureNotification(
                            `Character converted successfully! (Processing: ${processTime.toFixed(0)}ms, Total: ${totalTime.toFixed(0)}ms)`, 
                            'success', 
                            5000
                        );
                    })
                    .catch((error) => {
                        console.error("API Error:", error);
                        
                        let userMessage = error.message;
                        
                        // Handle network-level errors with more specific messages
                        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                            userMessage = 'Network error. Please check your internet connection and try again.';
                        } else if (error.message.includes('JSON') || error.message.includes('Unexpected')) {
                            userMessage = 'Received invalid data from D&D Beyond. Please try again.';
                        } else if (error.message.includes('timeout')) {
                            userMessage = 'Request timed out. Please try again.';
                        }
                        
                        showSecureNotification(userMessage, 'error', 8000);
                        
                        // Reset button state to allow retry
                        $("#getCharData").text("Get Character Data").prop('disabled', false);
                    })
            } else {
                // get debug data
                const testdata = "https://github.com/deltadave/DandD_Beyond-2-FantasyGrounds/blob/master/data/68380905_formatted.txt" //can change to test different characters.
                const charID = $('#getcharID').val().trim();
                const url = "https://character-service.dndbeyond.com/character/v5/character/";
                let headers = new Headers()
                headers.append('Content-Type', 'application/json');
                headers.append('Accept', 'application/json');
                headers.append('Origin','http://192.168.0.10/');
                headers.append('Access-Control-Allow-Origin', '*');
            
                /*
                fetch (url + charID + jsonPart //) 
                , {
                    mode: 'cors',
                    headers: headers
                })*/
                fetch(testdata)
                    .then(response=>response.text())
                    .then(contents => parseCharacter($.parseJSON(contents)))
                    .catch(() => console.log("Can't access " + url )) //testdata
            }
        }
    });

    $("#dlChar").on("click", function() {
        if ($("#textHere").val() == "") {
            showSecureNotification("You need to load a character first.", 'error');
            return;
        }
        if (pcFilename == "" || pcFilename == null) {
            var ts = Math.round((new Date()).getTime() / 1000);
            pcFilename = ts + ".xml";
        } else {
            pcFilename += ".xml";
        }

        var textFile = new Blob([$("#textHere").val()], {
            type: 'text/plain'
        });
        invokeSaveAsDialog(textFile, pcFilename);
    });

    $("#popCharID").on("change", function(event) {
        var firstNumber = event.args.item.label.indexOf("(");
        var secondNumber = event.args.item.label.indexOf(")");
        glCharID = event.args.item.label.substring(firstNumber + 1, secondNumber);
        $('#getcharID').val(glCharID);
    });

    $("#resetChar").on("click", function() {
        window.location.reload(false);
    });

    // fgVersion = 0: Classic; = 1: Unity
    // Removed version selector - defaulting to Unity (fgVersion = 1)
});


// parseCharacter function moved to characterParser.js

function parseCharacter_placeholder() {
    console.error('parseCharacter function has been moved to characterParser.js - ensure characterParser.js is loaded');
    return;
}

// Original parseCharacter function (3,286 lines) was here from line 445-3731

// getTotalAbilityScore function moved to utilities.js

// getObjects function moved to utilities.js

// replaceDash function moved to utilities.js

// capitalizeFirstLetter function moved to utilities.js

// pad function moved to utilities.js

// invokeSaveAsDialog function moved to uiHelpers.js

function invokeSaveAsDialog_placeholder() {
    console.error('invokeSaveAsDialog function has been moved to uiHelpers.js - ensure uiHelpers.js is loaded');
    return;
}

// Original invokeSaveAsDialog function (~50 lines) was here from line 464-512

// showSecureNotification function moved to uiHelpers.js

function showSecureNotification_placeholder() {
    console.error('showSecureNotification function has been moved to uiHelpers.js - ensure uiHelpers.js is loaded');
    return;
}

// Original showSecureNotification function (~40 lines) was here from line 515-550

// validateCharacterID function moved to uiHelpers.js

function validateCharacterID_placeholder() {
    console.error('validateCharacterID function has been moved to uiHelpers.js - ensure uiHelpers.js is loaded');
    return;
}

// Original validateCharacterID function (~32 lines) was here from line 553-584

// fixQuote function moved to utilities.js

// fixDesc function moved to utilities.js

// remove_tags_traits function moved to utilities.js

// getPactMagicSlots function moved to utilities.js


// getSpellSlots function moved to spellSlots.js

function getSpellSlots_placeholder() {
    console.error('getSpellSlots function has been moved to spellSlots.js - ensure spellSlots.js is loaded');
    return;
}

// Original getSpellSlots function (515 lines) was here from line 594-1109


// =============================================================================
// XML TEMPLATE CONSTANTS MOVED TO XMLTEMPLATES.JS
// =============================================================================

// All XML template constants (4,800+ lines) moved to xmlTemplates.js
// This included all class feature templates for:
// - Racial traits (Tiefling)
// - Barbarian features (rage, danger sense, totem spirits, etc.)
// - Bard features (bardic inspiration, jack of all trades, etc.)
// - Cleric features (turn undead, channel divinity, etc.)
// - Druid features (wild shape, land stride, etc.)
// - Fighter features (action surge, second wind, maneuvers, etc.)
// - Monk features (unarmed strike, ki points, elemental disciplines, etc.)
// - Paladin features (divine sense, lay on hands, auras, etc.)
// - Ranger features (favored enemy, natural explorer, etc.)
// - Rogue features (sneak attack, evasion, etc.)
// - Sorcerer features (font of magic, metamagic, etc.)
// - Warlock features (eldritch invocations, pact features, etc.)
// - Wizard features (arcane recovery, spell mastery, etc.)
// - Artificer features (placeholder section)

// Total templates extracted: 171 XML template constants
