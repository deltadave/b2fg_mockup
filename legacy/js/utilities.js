/*jshint esversion: 6 */
/*
 * Utilities Module
 * 
 * Contains utility functions for data manipulation, string processing,
 * and performance monitoring used throughout the D&D character converter.
 * 
 * Functions:
 * - Data traversal and searching
 * - String manipulation and sanitization  
 * - Performance timing utilities
 * - HTML/XML sanitization
 */

// =============================================================================
// DATA TRAVERSAL AND SEARCH UTILITIES
// =============================================================================

/**
 * Recursively search through an object for properties matching key/value criteria
 * Uses iterative approach for better performance than recursion
 * @param {Object} obj - Object to search through
 * @param {string} key - Property key to match (empty string matches any key)
 * @param {*} val - Property value to match (empty string matches any value)
 * @returns {Array} Array of objects that match the criteria
 */
function getObjects(obj, key, val) {
    var objects = [];
    var stack = [obj]; // Use iterative approach instead of recursion
    
    while (stack.length > 0) {
        var current = stack.pop();
        
        for (var i in current) {
            if (!current.hasOwnProperty(i)) continue;
            
            if (typeof current[i] == 'object' && current[i] !== null) {
                stack.push(current[i]); // Add to stack instead of recursive call
            } else if (i == key && current[i] == val || i == key && val == '') {
                objects.push(current);
            } else if (current[i] == val && key == ''){
                if (objects.indexOf(current) == -1){ // Use indexOf instead of lastIndexOf
                    objects.push(current);
                }
            }
        }
    }
    return objects;
}

/**
 * Helper function to safely access nested object properties
 * @param {Object} obj - Object to access
 * @param {string} path - Dot-separated path (e.g., "character.race.name")
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} Value at path or defaultValue
 */
function safeAccess(obj, path, defaultValue = null) {
    try {
        const result = path.split('.').reduce((current, key) => current && current[key], obj);
        return result !== undefined && result !== null ? result : defaultValue;
    } catch (e) {
        console.warn(`Safe access failed for path: ${path}`, e);
        return defaultValue;
    }
}

// =============================================================================
// CANONICAL HTML SANITIZATION
// =============================================================================

/**
 * Canonical HTML sanitization function for all text processing needs
 * Replaces fixQuote(), fixDesc(), and remove_tags_traits() with unified approach
 * 
 * @param {string} input - Input string that may contain HTML/text to sanitize
 * @param {Object} options - Sanitization options
 * @param {string} options.mode - 'text' for simple text, 'html' for HTML content
 * @param {number} options.maxLength - Maximum length (default: 10000 for html, 1000 for text)
 * @param {boolean} options.preserveFormatting - Keep line breaks and basic formatting
 * @returns {string} Sanitized string safe for XML output
 */
function sanitizeForXML(input, options = {}) {
    // Handle null/undefined/non-string input
    if (!input || typeof input !== 'string') {
        return "";
    }
    
    // Default options
    const opts = {
        mode: 'html',
        maxLength: options.mode === 'text' ? 1000 : 10000,
        preserveFormatting: options.mode !== 'text',
        ...options
    };
    
    // Initial length limit and basic cleanup
    let result = String(input).substring(0, opts.maxLength);
    
    // Step 1: Decode HTML entities first to normalize content
    result = result
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">") 
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&ndash;/g, "-");
    
    if (opts.mode === 'html') {
        // Step 2: HTML-specific processing
        result = processHTMLContent(result);
    }
    
    // Step 3: Final XML safety processing
    result = makeXMLSafe(result, opts);
    
    return result.trim();
}

/**
 * Process HTML content - apply whitelist filtering and structure fixes
 * @private
 */
function processHTMLContent(html) {
    // Whitelist of allowed HTML tags
    const allowedTags = ['p', 'a', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'blockquote', 'div', 'span', 'br', 'br/', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption'];
    
    let result = html;
    
    // Feature flag: track non-whitelisted tags for debugging
    const showRemovedTags = window.DEBUG_SHOW_REMOVED_TAGS || false;
    const removedTags = new Set();
    
    // Convert strong tags to b tags for consistency
    result = result
        .replace(/<strong([^>]*)>/gi, "<b$1>")
        .replace(/<\/strong>/gi, "</b>");
    
    // Remove non-whitelisted HTML tags
    result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/gi, function(match, tagName) {
        const tag = tagName.toLowerCase();
        if (allowedTags.includes(tag)) {
            return match; // Keep whitelisted tags
        } else {
            if (showRemovedTags) {
                removedTags.add(tag);
            }
            return ''; // Remove non-whitelisted tags
        }
    });
    
    // Remove dangerous elements and attributes
    result = result
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")   // Remove styles
        .replace(/on\w+\s*=\s*[^>]*/gi, "")                // Remove event handlers
        .replace(/javascript:/gi, "")                        // Remove javascript:
        .replace(/vbscript:/gi, "")                         // Remove vbscript:
        .replace(/href="[^">]*>/gi, 'href="#">')             // Fix malformed href
        .replace(/href='[^'>]*>/gi, "href='#'>");            // Fix malformed href
    
    // Conservative tag balancing for simple formatting tags only
    // Disabled for now as it was adding orphaned tags
    // result = balanceSimpleTags(result);
    
    // Log removed tags if feature flag is enabled
    if (showRemovedTags && removedTags.size > 0) {
        console.log('🚫 Non-whitelisted HTML tags removed:', Array.from(removedTags).sort());
    }
    
    return result;
}

/**
 * Balance simple HTML tags that commonly have missing closing tags
 * @private
 */
function balanceSimpleTags(html) {
    let result = html;
    
    // Only balance simple text formatting tags
    const simpleTagsToBalance = ['p', 'i', 'b', 'em'];
    
    simpleTagsToBalance.forEach(tag => {
        const openRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
        const closeRegex = new RegExp(`<\\/${tag}>`, 'gi');
        const openMatches = (result.match(openRegex) || []).length;
        const closeMatches = (result.match(closeRegex) || []).length;
        
        // Only add closing tags if there's a reasonable imbalance and we're missing closing tags
        if (openMatches > closeMatches && (openMatches - closeMatches) <= 2) {
            for (let i = 0; i < openMatches - closeMatches; i++) {
                result += `</${tag}>`;
            }
        }
    });
    
    // Remove orphaned closing tags for simple tags
    const tagsToCheck = ['i', 'b', 'em', 'p'];
    tagsToCheck.forEach(tag => {
        const openCount = (result.match(new RegExp(`<${tag}[^>]*>`, 'gi')) || []).length;
        const closeCount = (result.match(new RegExp(`<\\/${tag}>`, 'gi')) || []).length;
        
        if (closeCount > openCount) {
            // Remove excess closing tags from the end
            for (let i = 0; i < closeCount - openCount; i++) {
                const lastIndex = result.lastIndexOf(`</${tag}>`);
                if (lastIndex !== -1) {
                    result = result.substring(0, lastIndex) + result.substring(lastIndex + `</${tag}>`.length);
                }
            }
        }
    });
    
    return result;
}

/**
 * Make content safe for XML output
 * @private
 */
function makeXMLSafe(content, opts) {
    let result = content;
    
    // For HTML mode, we need to preserve HTML structure while making it XML-safe
    if (opts.mode === 'html') {
        // For HTML content within XML formattedtext elements:
        // - Preserve HTML structure (< and > for tags)
        // - Keep normal quotes for HTML attributes 
        // - Only escape & characters that aren't part of valid entities
        result = result
            .replace(/&(?!amp;|quot;|#39;|lt;|gt;|#\d+;)/g, "&amp;");  // Escape unescaped & only
        // Note: < > " ' are preserved for HTML structure within XML formattedtext
    } else {
        // Text mode - escape everything for XML safety
        result = result
            .replace(/&/g, "&amp;")      // Must be first
            .replace(/</g, "&lt;")       // Escape < characters  
            .replace(/>/g, "&gt;")       // Escape > characters
            .replace(/"/g, "&quot;")     // Prevent attribute injection
            .replace(/'/g, "&#39;")      // Prevent attribute injection
            .replace(/\//g, "&#x2F;");   // Forward slash for extra safety
    }
    
    // Handle whitespace based on options
    if (!opts.preserveFormatting) {
        result = result
            .replace(/\n/g, " ")         // Replace newlines with spaces
            .replace(/\r/g, " ")         // Replace carriage returns
            .replace(/\t/g, " ")         // Replace tabs
            .replace(/\s+/g, " ");       // Normalize multiple spaces
    }
    
    // Remove control characters
    result = result.replace(/[\x00-\x1F\x7F]/g, "");
    
    // Final length limit
    return result.substring(0, opts.maxLength);
}

// =============================================================================
// CONVENIENCE FUNCTIONS (using canonical sanitizer)
// =============================================================================

/**
 * Simple text sanitization (replaces fixQuote)
 * @param {string} text - Text to sanitize
 * @returns {string} XML-safe text
 */
function sanitizeText(text) {
    return sanitizeForXML(text, { mode: 'text', maxLength: 1000, preserveFormatting: false });
}

/**
 * HTML content sanitization (replaces fixDesc and remove_tags_traits)
 * @param {string} html - HTML content to sanitize
 * @returns {string} XML-safe HTML
 */
function sanitizeHTML(html) {
    return sanitizeForXML(html, { mode: 'html', maxLength: 10000, preserveFormatting: true });
}

// =============================================================================
// STRING MANIPULATION UTILITIES
// =============================================================================

/**
 * Replace dashes and spaces with underscores
 * @param {string} str - Input string
 * @returns {string} String with dashes/spaces replaced by underscores
 */
function replaceDash(str) {
    firstStep = str.replace(/-/g, "_");
    return firstStep.replace(/\s/g, "_");
}

/**
 * Capitalize first letter of a string
 * @param {string} string - Input string
 * @returns {string} String with first letter capitalized
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Pad a number with leading zeros
 * @param {number} num - Number to pad
 * @param {number} size - Total length desired
 * @returns {string} Zero-padded string
 */
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

/**
 * Convert string to proper case (first letter of each word capitalized)
 * @param {string} str - Input string
 * @returns {string} Proper case string
 */
function convert_case(str) {
    var lower = str.toLowerCase();
    return lower.replace(/(^|\\s)(w)/g, function(x) {
        return x.toUpperCase();
    });
}

// =============================================================================
// HTML/XML SANITIZATION UTILITIES
// =============================================================================

/**
 * Comprehensive HTML entity encoding for XSS prevention
 * @param {string} badString - Input string to sanitize
 * @returns {string} Sanitized and encoded string
 */
/**
 * @deprecated Use sanitizeText() instead - Legacy wrapper for compatibility
 */
function fixQuote(badString) {
    return sanitizeText(badString);
}

// Legacy fixDesc function implementation removed - see wrapper function below
// All legacy function implementations cleaned up - using canonical sanitizer

/**
 * @deprecated Use sanitizeHTML() instead - Legacy wrapper for compatibility
 */
function fixDesc(badString) {
    return sanitizeHTML(badString);
}

/**
 * @deprecated Use sanitizeHTML() instead - Legacy wrapper for compatibility
 */
function remove_tags_traits(badString) {
    return sanitizeHTML(badString);
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Performance timer utility for measuring code execution time
 * @param {string} label - Label for the timer
 * @returns {Object} Timer object with start/end methods
 */
function createPerformanceTimer(label) {
    const startTime = performance.now();
    
    return {
        label: label,
        startTime: startTime,
        
        /**
         * End the timer and log the result
         * @param {string} details - Additional details to log
         * @returns {number} Elapsed time in milliseconds
         */
        end: function(details = '') {
            const endTime = performance.now();
            const elapsed = endTime - this.startTime;
            console.log(`⏱️  ${this.label}: ${elapsed.toFixed(2)}ms ${details}`);
            return elapsed;
        },
        
        /**
         * Get elapsed time without ending the timer
         * @returns {number} Elapsed time in milliseconds
         */
        peek: function() {
            return performance.now() - this.startTime;
        }
    };
}

/**
 * Log performance summary with multiple timings
 * @param {Array} timings - Array of {label, time} objects
 * @param {string} totalLabel - Label for total time
 */
function logPerformanceSummary(timings, totalLabel = 'Total') {
    console.log('=== Performance Summary ===');
    let total = 0;
    
    timings.forEach(timing => {
        console.log(`${timing.label}: ${timing.time.toFixed(2)}ms`);
        total += timing.time;
    });
    
    console.log(`${totalLabel}: ${total.toFixed(2)}ms`);
    console.log('========================');
}

// =============================================================================
// SPELL PROCESSING UTILITIES  
// =============================================================================

/**
 * Calculate pact magic spell slots based on warlock level
 * @param {number} level - Character level
 * @returns {number} Number of pact magic slots
 */
function getPactMagicSlots(level) {
    // 1-2 1st level
    // 3-4 2nd level
    // 5-6 3rd level
    // 7-8 4th level
    // 9+ 5th level

    switch(level){
        case 1:
            return 1;

        case 2: case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 10:
            return 2;

        case 11: case 12: case 13: case 14: case 15: case 16:
            return 3;

        case 17: case 18: case 19: case 20:
            return 4;
    }
}

// =============================================================================
// INVENTORY AND CONTAINER UTILITIES
// =============================================================================

/**
 * Build a nested inventory structure from flat inventory array
 * @param {Array} inventory - Flat inventory array from character data
 * @param {string} characterId - Character ID (root container)
 * @returns {Object} Nested inventory structure with containers and their contents
 */
function buildNestedInventory(inventory, characterId) {
    console.log('Building nested inventory structure...');
    
    // Group items by their container
    const itemsByContainer = {};
    const containers = new Map();
    
    // First pass: identify all items and containers
    inventory.forEach(item => {
        const containerId = item.containerEntityId.toString();
        
        // Track containers
        if (item.definition.isContainer) {
            containers.set(item.id.toString(), {
                item: item,
                children: []
            });
        }
        
        // Group items by container
        if (!itemsByContainer[containerId]) {
            itemsByContainer[containerId] = [];
        }
        itemsByContainer[containerId].push(item);
    });
    
    // Build the nested structure
    const rootItems = itemsByContainer[characterId] || [];
    const nestedInventory = {
        characterId: characterId,
        rootItems: [],
        containers: containers
    };
    
    rootItems.forEach(item => {
        if (item.definition.isContainer) {
            const containerData = {
                ...item,
                contents: itemsByContainer[item.id.toString()] || []
            };
            nestedInventory.rootItems.push(containerData);
        } else {
            nestedInventory.rootItems.push(item);
        }
    });
    
    console.log(`Found ${nestedInventory.rootItems.length} root items, ${containers.size} containers`);
    return nestedInventory;
}

/**
 * Generate Fantasy Grounds XML for a container's contents
 * @param {Array} contents - Array of items inside the container
 * @param {number} startIndex - Starting index for item IDs
 * @returns {Object} Object with XML string and next available index
 */
function generateContainerContentsXML(contents, startIndex) {
    let xml = '';
    let currentIndex = startIndex;
    
    if (contents && contents.length > 0) {
        xml += '\t\t\t\t<inventorylist>\n';
        
        contents.forEach(item => {
            const thisIteration = pad(currentIndex, 5);
            xml += `\t\t\t\t\t<id-${thisIteration}>\n`;
            xml += `\t\t\t\t\t\t<count type="number">${parseInt(item.quantity)}</count>\n`;
            xml += `\t\t\t\t\t\t<name type="string">${fixQuote(item.definition.name)}</name>\n`;
            xml += `\t\t\t\t\t\t<weight type="number">${parseInt(item.definition.weight) / parseInt(item.definition.bundleSize)}</weight>\n`;
            xml += '\t\t\t\t\t\t<locked type="number">1</locked>\n';
            xml += '\t\t\t\t\t\t<isidentified type="number">1</isidentified>\n';
            
            // Add type information
            if (item.definition.subType == null) {
                xml += `\t\t\t\t\t\t<type type="string">${fixQuote(item.definition.filterType)}</type>\n`;
            } else {
                xml += `\t\t\t\t\t\t<type type="string">${fixQuote(item.definition.subType)}</type>\n`;
            }
            
            // Add cost if available
            if (item.definition.cost != null) {
                xml += `\t\t\t\t\t\t<cost type="string">${item.definition.cost} gp</cost>\n`;
            } else {
                xml += '\t\t\t\t\t\t<cost type="string">-</cost>\n';
            }
            
            // Add description if available
            if (item.definition.description != null && item.definition.description !== '') {
                xml += `\t\t\t\t\t\t<description type="formattedtext">${fixDesc(item.definition.description)}</description>\n`;
            }
            
            xml += `\t\t\t\t\t</id-${thisIteration}>\n`;
            currentIndex++;
        });
        
        xml += '\t\t\t\t</inventorylist>\n';
    }
    
    return { xml: xml, nextIndex: currentIndex };
}

/**
 * Process inventory with proper Fantasy Grounds flat structure using <location> fields
 * @param {Array} inventory - Character inventory array
 * @param {string} characterId - Character ID
 * @param {Object} state - Processing state object (includes weapon arrays, armor tracking, etc.)
 * @returns {string} Complete inventory XML
 */
function processNestedInventoryXML(inventory, characterId, state) {
    let xml = '';
    let itemIndex = 1;
    
    // Create a map of container IDs to container names for location references
    const containerNames = new Map();
    
    // First pass: identify containers and their names
    inventory.forEach(item => {
        if (item.definition.isContainer) {
            containerNames.set(item.id.toString(), item.definition.name);
        }
    });
    
    console.log('Processing inventory with location-based structure...');
    
    // Process all items in flat structure
    inventory.forEach(item => {
        // Skip items with zero or negative quantity
        if (!item.quantity || item.quantity <= 0) {
            return;
        }
        
        // Count ammunition for weapon processing
        if (item.definition.name == "Crossbow Bolts" || item.definition.name == "Bolts") {
            state.numBolts += parseInt(item.quantity);
        } else if (item.definition.name == "Arrows") {
            state.numArrows += parseInt(item.quantity);
        } else if (item.definition.name == "Blowgun Needles") {
            state.numNeedles += parseInt(item.quantity);
        } else if (item.definition.name == "Sling Bullets") {
            state.numBullets += parseInt(item.quantity);
        }
        
        // Track armor and shield usage
        if (item.equipped && item.definition.filterType == "Armor") {
            if (item.definition.type == "Shield") {
                state.usingShield = 1;
            } else if (item.definition.type && item.definition.type.match("Armor")) {
                state.wearingArmor = 1;
                if (item.definition.type.match("Heavy")) {
                    state.usingHeavyArmor = 1;
                } else if (item.definition.type.match("Medium")) {
                    state.usingMediumArmor = 1;
                } else if (item.definition.type.match("Light")) {
                    state.usingLightArmor = 1;
                }
            }
        }
        
        // Process weapon tracking for items with damage property
        if (item.definition.hasOwnProperty("damage") && item.definition.attackType != null) {
            state.weaponID.push(itemIndex);
            state.weaponName.push(item.definition.name);
            state.weaponQuantity = state.weaponQuantity || [];
            state.weaponQuantity.push(parseInt(item.quantity));
            
            // Build properties string
            let thisProperties = "";
            if (item.definition.properties && Array.isArray(item.definition.properties)) {
                item.definition.properties.forEach(weapProp => {
                    if (weapProp.name == "Ammunition") {
                        thisProperties += "Ammunition (" + item.definition.range + "/" + item.definition.longRange + "), ";
                    } else if (weapProp.name == "Thrown") {
                        thisProperties += "Thrown (" + item.definition.range + "/" + item.definition.longRange + "), ";
                    } else {
                        thisProperties += weapProp.name + ", ";
                    }
                });
            }
            thisProperties = thisProperties.trim().slice(0, -1);
            state.weaponProperties.push(thisProperties);
            
            // Determine weapon base ability
            if (thisProperties && thisProperties.includes("Finesse")) {
                if (state.strScore >= state.dexScore) {
                    state.weaponBase.push("strength");
                } else {
                    state.weaponBase.push("dexterity");
                }
            } else if (thisProperties && thisProperties.includes("Range")) {
                state.weaponBase.push("dexterity");
            } else {
                state.weaponBase.push("base");
            }
            
            // Calculate weapon bonus
            let curWeapBon = 0;
            if (item.definition.grantedModifiers && Array.isArray(item.definition.grantedModifiers)) {
                for (let d = 0; d < item.definition.grantedModifiers.length; d++) {
                    if (item.definition.grantedModifiers[d].type == "bonus" && item.equipped == true) {
                        if (item.isAttuned == true && item.definition.canAttune == true) {
                            curWeapBon = item.definition.grantedModifiers[d].value;
                        } else if (item.definition.canAttune == false) {
                            curWeapBon = item.definition.grantedModifiers[d].value;
                        }
                    }
                }
            }
            state.weaponBonus.push(curWeapBon);
            
            // Process damage dice
            if (item.definition.damage != null) {
                if (state.fgVersion == 0) {
                    let realString = "";
                    for (let wd40 = 0; wd40 < item.definition.damage.diceCount; wd40++) {
                        realString += "d" + item.definition.damage.diceValue + ",";
                    }
                    realString = realString.slice(0, -1);
                    state.weaponDice.push(realString);
                } else {
                    state.weaponDice.push(item.definition.damage.diceCount + "d" + item.definition.damage.diceValue);
                }
            } else {
                state.weaponDice.push("d0");
            }
            
            if (item.definition.damageType != null) {
                state.weaponType.push(item.definition.damageType.toLowerCase());
            } else {
                state.weaponType.push("");
            }
        }
        
        // Process armor class bonuses and saving throw bonuses
        if (item.definition.hasOwnProperty("grantedModifiers")) {
            for (let m = 0; m < item.definition.grantedModifiers.length; m++) {
                if (item.definition.grantedModifiers[m].subType == "armor-class" && item.equipped == true && item.definition.grantedModifiers[m].type == "bonus") {
                    if (item.definition.filterType == "Armor") {
                        state.addBonusArmorAC += item.definition.grantedModifiers[m].value;
                    } else {
                        state.addBonusOtherAC += item.definition.grantedModifiers[m].value;
                    }
                }
                if (item.definition.grantedModifiers[m].subType == "saving-throws" && item.equipped == true && item.definition.grantedModifiers[m].type == "bonus") {
                    state.addSavingThrows += item.definition.grantedModifiers[m].value;
                }
            }
        }

        // Generate XML for this item
        const thisIteration = pad(itemIndex, 5);
        xml += `\t\t\t<id-${thisIteration}>\n`;
        xml += `\t\t\t\t<count type="number">${parseInt(item.quantity)}</count>\n`;
        xml += `\t\t\t\t<name type="string">${fixQuote(item.definition.name)}</name>\n`;
        xml += `\t\t\t\t<weight type="number">${parseInt(item.definition.weight) / parseInt(item.definition.bundleSize)}</weight>\n`;
        xml += "\t\t\t\t<locked type=\"number\">1</locked>\n";
        xml += "\t\t\t\t<isidentified type=\"number\">1</isidentified>\n";

        // Add location field if item is in a container
        const containerEntityId = item.containerEntityId.toString();
        if (containerEntityId !== characterId && containerNames.has(containerEntityId)) {
            const containerName = containerNames.get(containerEntityId);
            xml += `\t\t\t\t<location type="string">${fixQuote(containerName)}</location>\n`;
        }

        // Add type information and armor details
        if(item.definition.subType == null) {
            xml += `\t\t\t\t<type type="string">${fixQuote(item.definition.filterType)}</type>\n`;
            if(item.definition.filterType == "Armor") {
                if(item.definition.type != null && item.definition.type != "") {
                    xml += `\t\t\t\t<subtype type="string">${fixQuote(item.definition.type)}</subtype>\n`;
                    xml += `\t\t\t\t<ac type="number">${item.definition.armorClass}</ac>\n`;
                }
                if(item.definition.stealthCheck != null) {
                    if(item.definition.stealthCheck == 2) {
                        xml += "\t\t\t\t<stealth type=\"string\">Disadvantage</stealth>\n";
                    } else {
                        xml += "\t\t\t\t<stealth type=\"string\">-</stealth>\n";
                    }
                }
                if(item.definition.strengthRequirement != null) {
                    xml += `\t\t\t\t<strength type="string">Str ${item.definition.strengthRequirement}</strength>\n`;
                } else {
                    xml += "\t\t\t\t<strength type=\"string\">-</strength>\n";
                }
            }
        } else {
            xml += `\t\t\t\t<type type="string">${fixQuote(item.definition.subType)}</type>\n`;
        }
        
        // Add cost
        if(item.definition.cost == null) {
            xml += "\t\t\t\t<cost type=\"string\">-</cost>\n";
        } else {
            xml += `\t\t\t\t<cost type="string">${item.definition.cost} gp</cost>\n`;
        }
        
        // Add rarity/attunement info
        if(item.definition.canAttune == true) {
            xml += `\t\t\t\t<rarity type="string">${item.definition.rarity} (Requires Attunement)</rarity>\n`;
        } else {
            xml += `\t\t\t\t<rarity type="string">${item.definition.rarity}</rarity>\n`;
        }
        
        // Handle equipped status
        if(item.equipped == true) {
            xml += "\t\t\t\t<carried type=\"number\">2</carried>\n";
        } else {
            xml += "\t\t\t\t<carried type=\"number\">1</carried>\n";
        }
        
        // Add weapon damage and properties if applicable
        if(item.definition.hasOwnProperty("damage") && item.definition.attackType != null) {
            let thisDamage = "";
            let thisDamType = "";
            if(item.definition.damage != null) {
                thisDamage = item.definition.damage.diceString;
            }
            if(item.definition.damageType != null) {
                thisDamType = item.definition.damageType;
            }
            xml += `\t\t\t\t<damage type="string">${thisDamage} ${thisDamType}</damage>\n`;
            
            // Add weapon properties
            let thisProperties = "";
            if (item.definition.properties && Array.isArray(item.definition.properties)) {
                item.definition.properties.forEach(weapProp => {
                    if(weapProp.name == "Ammunition") {
                        thisProperties += "Ammunition (" + item.definition.range + "/" + item.definition.longRange + "), ";
                    } else if(weapProp.name == "Thrown") {
                        thisProperties += "Thrown (" + item.definition.range + "/" + item.definition.longRange + "), ";
                    } else {
                        thisProperties += weapProp.name + ", ";
                    }
                });
            }
            thisProperties = thisProperties.trim().slice(0, -1);
            xml += `\t\t\t\t<properties type="string">${thisProperties}</properties>\n`;
            
            // Add weapon bonus
            if (item.definition.grantedModifiers && Array.isArray(item.definition.grantedModifiers)) {
                for(let d = 0; d < item.definition.grantedModifiers.length; d++) {
                    if (item.definition.grantedModifiers[d].type == "bonus" && item.equipped == true) {
                        if (item.isAttuned == true && item.definition.canAttune == true) {
                            xml += `\t\t\t\t<bonus type="number">${item.definition.grantedModifiers[d].value}</bonus>\n`;
                        } else if (item.definition.canAttune == false) {
                            xml += `\t\t\t\t<bonus type="number">${item.definition.grantedModifiers[d].value}</bonus>\n`;
                        }
                    }
                }
            }
            
            // Add weapon subtype for classification
            const thisWeaponName = item.definition.name.toLowerCase().replace(/\s/g, "_").replace(/,/g, "");
            if(state.simpleRangedWeapon && state.simpleRangedWeapon.indexOf(thisWeaponName) != -1) {
                xml += "\t\t\t\t<subtype type=\"string\">Simple Ranged Weapon</subtype>\n";
            } else if(state.simpleMeleeWeapon && state.simpleMeleeWeapon.indexOf(thisWeaponName) != -1) {
                xml += "\t\t\t\t<subtype type=\"string\">Simple Melee Weapon</subtype>\n";
            } else if(state.martialRangedWeapon && state.martialRangedWeapon.indexOf(thisWeaponName) != -1) {
                xml += "\t\t\t\t<subtype type=\"string\">Martial Ranged Weapon</subtype>\n";
            } else if(state.martialMeleeWeapon && state.martialMeleeWeapon.indexOf(thisWeaponName) != -1) {
                xml += "\t\t\t\t<subtype type=\"string\">Martial Melee Weapon</subtype>\n";
            }
        }
        
        // Add description
        if(item.definition.description == null) {
            xml += "\t\t\t\t<description type=\"formattedtext\">-</description>\n";
        } else {
            xml += `\t\t\t\t<description type="formattedtext">${fixDesc(item.definition.description)}</description>\n`;
        }
        
        xml += `\t\t\t</id-${thisIteration}>\n`;
        itemIndex++;
    });
    
    return xml;
}

// =============================================================================
// ABILITY SCORE UTILITIES
// =============================================================================

/**
 * Process all ability score bonuses from all sources and populate character.bonusStats
 * @param {Object} character - Character data to modify
 */
function processAbilityScoreBonuses(character) {
    console.log('Processing ability score bonuses from all sources...');
    
    // Initialize bonusStats if it doesn't exist or has null values
    if (!character.bonusStats || character.bonusStats.length === 0) {
        character.bonusStats = [];
        for (let i = 1; i <= 6; i++) {
            character.bonusStats.push({ id: i, name: null, value: 0 });
        }
    } else {
        // Ensure all bonusStats have numeric values instead of null
        character.bonusStats.forEach(stat => {
            if (stat.value === null || stat.value === undefined) {
                stat.value = 0;
            }
        });
    }
    
    // Define all modifier sources to check
    const modifierSources = ['race', 'class', 'background', 'item', 'feat'];
    
    // Process modifiers from each source
    modifierSources.forEach(source => {
        if (character.modifiers && character.modifiers[source]) {
            character.modifiers[source].forEach(modifier => {
                if (modifier.type === "bonus" && modifier.subType && modifier.subType.endsWith("-score")) {
                    // Extract ability from subType (e.g., "strength-score" -> "strength")
                    const abilityName = modifier.subType.replace("-score", "");
                    // Use existing justAbilities array from gameConstants.js
                    const abilityId = justAbilities.indexOf(abilityName) + 1; // +1 because IDs are 1-based
                    
                    if (abilityId > 0 && modifier.fixedValue !== null && modifier.fixedValue !== undefined) {
                        const bonus = parseInt(modifier.fixedValue) || 0;
                        if (bonus > 0 && character.bonusStats[abilityId - 1]) {
                            character.bonusStats[abilityId - 1].value += bonus;
                            console.log(`Applied ${source} bonus: +${bonus} to ${abilityName} (ID: ${abilityId})`);
                        }
                    }
                }
            });
        }
    });
    
    // Log final bonus stats for debugging
    console.log('Final ability score bonuses:');
    justAbilities.forEach((ability, index) => {
        const bonus = character.bonusStats[index].value;
        if (bonus > 0) {
            console.log(`  ${ability}: +${bonus}`);
        }
    });
}

/**
 * Get total ability score including base, racial, and feat bonuses
 * @param {Object} character - Character data
 * @param {number} scoreId - Ability score ID (1-6)
 * @returns {number} Total ability score
 */
function getTotalAbilityScore(character, scoreId) {
    // Get base score
    let baseScore = 10;
    if (character.stats && character.stats.length >= scoreId) {
        baseScore = character.stats[scoreId - 1].value || 10;
    }
    
    // Get racial/feat bonuses
    let bonusScore = 0;
    if (character.bonusStats && character.bonusStats.length >= scoreId) {
        bonusScore = character.bonusStats[scoreId - 1].value || 0;
    }
    
    // Check for ability score overrides
    let overrideScore = null;
    if (character.overrideStats && character.overrideStats.length >= scoreId) {
        overrideScore = character.overrideStats[scoreId - 1].value;
    }
    
    // Return override if it exists, otherwise base + bonus
    return overrideScore !== null ? overrideScore : baseScore + bonusScore;
}

/**
 * Calculate encumbrance values according to D&D 5E rules
 * @param {Object} character - Character data
 * @param {Array} inventory - Character inventory array
 * @returns {Object} Encumbrance values for Fantasy Grounds XML
 */
function calculateEncumbrance(character, inventory) {
    // Calculate total weight carried
    let totalWeight = 0;
    const characterId = character.id.toString();
    
    // Create a map of containers and their weight multipliers
    const containerWeightMultipliers = new Map();
    inventory.forEach(item => {
        if (item.definition.isContainer && item.definition.weightMultiplier !== undefined) {
            containerWeightMultipliers.set(item.id.toString(), item.definition.weightMultiplier);
        }
    });
    
    inventory.forEach(item => {
        const itemWeight = item.definition.weight || 0;
        const quantity = item.quantity;
        
        // Skip items with zero or null quantity
        if (!quantity || quantity <= 0) {
            return;
        }
        
        const containerEntityId = item.containerEntityId.toString();
        const characterId = character.id.toString();
        
        // Check if item is in a container with special weight rules
        if (containerEntityId !== characterId && containerWeightMultipliers.has(containerEntityId)) {
            const weightMultiplier = containerWeightMultipliers.get(containerEntityId);
            if (weightMultiplier === 0) {
                // Items in containers with weightMultiplier 0 (like Handy Haversack, Quiver of Ehlonna) don't add weight
                return;
            }
        }
        
        // Add the item's weight
        totalWeight += itemWeight * quantity;
    });
    
    // Get character's Strength score
    const strScore = getTotalAbilityScore(character, 1); // Strength is ID 1
    
    // Base carrying capacity is Strength score × 15
    let baseCapacity = strScore * 15;
    
    // Check for Powerful Build trait (Goliaths count as one size larger)
    let hasPowerfulBuild = false;
    if (character.race.racialTraits) {
        // Handle both array and object formats
        const traitsArray = Array.isArray(character.race.racialTraits) 
            ? character.race.racialTraits 
            : Object.values(character.race.racialTraits);
        
        hasPowerfulBuild = traitsArray.some(trait => 
            trait && trait.definition && trait.definition.name === "Powerful Build"
        );
    }
    
    if (hasPowerfulBuild) {
        // Powerful Build doubles carrying capacity
        baseCapacity *= 2;
    }
    
    // D&D 5E encumbrance thresholds:
    // - Normal: up to Strength × 5 (or × 10 with Powerful Build)
    // - Encumbered: Strength × 5 to × 10 (or × 10 to × 20 with Powerful Build)
    // - Heavily Encumbered: Strength × 10 to × 15 (or × 20 to × 30 with Powerful Build)
    // - Max capacity: Strength × 15 (or × 30 with Powerful Build)
    
    const multiplier = hasPowerfulBuild ? 2 : 1;
    const encumbered = strScore * 5 * multiplier;        // 85 for Str 17 with Powerful Build
    const encumberedHeavy = strScore * 10 * multiplier;  // 170 for Str 17 with Powerful Build  
    const maxCapacity = strScore * 15 * multiplier;      // 255 for Str 17 with Powerful Build
    const liftPushDrag = strScore * 30 * multiplier;     // 510 for Str 17 with Powerful Build
    
    return {
        load: Math.round(totalWeight),
        max: maxCapacity,
        encumbered: encumbered,
        encumberedHeavy: encumberedHeavy,
        liftPushDrag: liftPushDrag
    };
}

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make all utility functions globally available for use by other scripts
if (typeof window !== 'undefined') {
    // Data traversal functions
    window.getObjects = getObjects;
    window.safeAccess = safeAccess;
    
    // String manipulation functions
    window.replaceDash = replaceDash;
    window.capitalizeFirstLetter = capitalizeFirstLetter;
    window.pad = pad;
    window.convert_case = convert_case;
    
    // HTML/XML sanitization functions
    window.fixQuote = fixQuote;
    window.fixDesc = fixDesc;
    window.remove_tags_traits = remove_tags_traits;
    window.sanitizeText = sanitizeText;
    window.sanitizeHTML = sanitizeHTML;
    window.sanitizeForXML = sanitizeForXML;
    
    // Performance monitoring functions
    window.createPerformanceTimer = createPerformanceTimer;
    window.logPerformanceSummary = logPerformanceSummary;
    
    // Specialized utility functions
    window.getPactMagicSlots = getPactMagicSlots;
    window.getTotalAbilityScore = getTotalAbilityScore;
    window.processAbilityScoreBonuses = processAbilityScoreBonuses;
    window.calculateEncumbrance = calculateEncumbrance;
    
    // Inventory and container functions
    window.buildNestedInventory = buildNestedInventory;
    window.generateContainerContentsXML = generateContainerContentsXML;
    window.processNestedInventoryXML = processNestedInventoryXML;
    
    // Debug flag for HTML sanitization
    window.DEBUG_SHOW_REMOVED_TAGS = false;
}