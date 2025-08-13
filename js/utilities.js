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
// STRING MANIPULATION UTILITIES
// =============================================================================

/**
 * Replace dashes and spaces with underscores
 * @param {string} str - Input string
 * @returns {string} String with dashes/spaces replaced by underscores
 */
function replaceDash(str) {
    firstStep = str.replace(/-/g, "_");
    return firstStep.replace(/\\s/g, "_");
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
function fixQuote(badString) {
    // Enhanced security: strict input validation and comprehensive sanitization
    if (badString == null || badString === undefined || badString === "") {
        return "";
    }
    
    // Convert to string if not already
    const inputString = String(badString);
    
    // Comprehensive HTML entity encoding for security
    let tempString = inputString
        .replace(/&/g, "&amp;")      // Must be first to avoid double-encoding
        .replace(/</g, "&lt;")       // Prevent HTML injection
        .replace(/>/g, "&gt;")       // Prevent HTML injection
        .replace(/"/g, "&quot;")     // Prevent attribute injection
        .replace(/'/g, "&#39;")      // Prevent attribute injection
        .replace(/\//g, "&#x2F;")    // Forward slash for extra safety
        .replace(/\n/g, " ")         // Replace newlines with spaces
        .replace(/\r/g, " ")         // Replace carriage returns
        .replace(/\t/g, " ")         // Replace tabs
        .replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters
    
    // Additional sanitization: limit length and remove potentially dangerous patterns
    tempString = tempString
        .substring(0, 1000) // Reasonable length limit
        .replace(/javascript:/gi, "") // Remove javascript: protocols
        .replace(/vbscript:/gi, "")   // Remove vbscript: protocols
        .replace(/data:/gi, "")       // Remove data: protocols
        .replace(/on\\w+\\s*=/gi, ""); // Remove event handlers
    
    return tempString.trim();
}

/**
 * Sanitizes HTML content while preserving allowed tags and converting entities
 * @param {string} badString - Input HTML string to process
 * @returns {string} Sanitized HTML string
 */
function fixDesc(badString) {
    // Enhanced security: strict input validation
    if (badString == null || badString === undefined || badString === "") {
        return "";
    }
    
    // Convert to string and limit initial length
    let inputString = String(badString).substring(0, 20000);
    
    // Step 1: Decode HTML entities first to normalize content
    let tempString1 = inputString
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x2F;/g, "/");
    
    // Step 2: Typography improvements - smart quotes and dashes
    let tempString2 = tempString1
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&ndash;/g, "-")
        .replace(/&mdash;/g, "—")
        .replace(/&#34;/g, '"')
        .replace(/&nbsp;/g, " ");
    
    // Step 3: Convert line breaks and headers for better formatting
    let tempString3 = tempString2
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "</p>\n")
        .replace(/<h([1-6])[^>]*>/gi, "<p><b>")
        .replace(/<\/h[1-6]>/gi, "</b></p>");
    
    // Step 4: Table improvements - convert th to td for better compatibility
    tempString3 = tempString3
        .replace(/<th\s+style/gi, "<td style")
        .replace(/<th\s+rowspan/gi, "<td rowspan")
        .replace(/<th\s+colspan/gi, "<td colspan")
        .replace(/<\/th>/gi, "</td>")
        .replace(/<th>/gi, "<td>");
    
    // Step 5: Clean up spans and remove dangerous elements
    tempString3 = tempString3
        .replace(/<span[^>]*>/gi, "")
        .replace(/<\/span>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")   // Remove styles
        .replace(/on\w+\s*=\s*[^>]*/gi, "")                // Remove event handlers
        .replace(/javascript:/gi, "")                        // Remove javascript:
        .replace(/vbscript:/gi, "")                         // Remove vbscript:
        .replace(/href="[^">]*>/gi, 'href="#">')             // Fix malformed href where > appears before closing quote
        .replace(/href='[^'>]*>/gi, "href='#'>")             // Fix malformed href where > appears before closing quote
    
    // Enhanced HTML tag balancing to prevent XML parsing errors
    function balanceHtmlTags(html) {
        const allowedTags = ['p', 'b', 'i', 'u', 'strong', 'em', 'table', 'tr', 'td', 'ul', 'ol', 'li'];
        const stack = [];
        let balancedResult = html;
        
        // Simple tag balancing - add missing closing tags
        allowedTags.forEach(tag => {
            const openRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
            const closeRegex = new RegExp(`<\\/${tag}>`, 'gi');
            const openMatches = (balancedResult.match(openRegex) || []).length;
            const closeMatches = (balancedResult.match(closeRegex) || []).length;
            
            // Add missing closing tags
            if (openMatches > closeMatches) {
                for (let i = 0; i < openMatches - closeMatches; i++) {
                    balancedResult += `</${tag}>`;
                }
            }
        });
        
        return balancedResult;
    }
    
    // Apply tag balancing to prevent XML parsing errors
    const balanced = balanceHtmlTags(tempString3);
    
    // Remove orphaned closing tags that don't have matching opening tags
    function removeOrphanedClosingTags(html) {
        let result = html;
        const tagsToCheck = ['u', 'i', 'b', 'strong', 'em'];
        
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
    
    const cleanedBalance = removeOrphanedClosingTags(balanced);
    
    // Step 6: Final cleanup and validation
    return cleanedBalance
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/<\/u>\s*<\/p>/gi, "</p>") // Remove stray </u> before closing paragraph
        .replace(/<\/u>\s*$/gi, "") // Remove stray </u> at end
        .replace(/\s*<\/u>\s*/gi, " ") // Replace stray </u> with space
        .trim()
        .substring(0, 10000); // Final length limit
}

/**
 * Remove and clean HTML tags from trait descriptions
 * Legacy function - consider using fixDesc for new implementations
 * @param {string} badString - Input HTML string
 * @returns {string} Cleaned string
 */
function remove_tags_traits(badString) {
    var tempString1 = badString.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    var tempString2 = tempString1.replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"');
    var tempString3 = tempString2.replace(/&#34;/g, '"').replace(/<br>/g, "<br />").replace(/&ndash;/g, "-");
    var tempString4 = tempString3.replace(/<th\sstyle/g, "<td style").replace(/<\/th>/g, "</td>").replace(/<th\srowspan/g, "<td rowspan").replace(/<th\scolspan/g, "<td colspan").replace(/<th>/g, "<td>");
    var tempString5 = tempString4.replace(/<span>/g, "").replace(/<\/span>/g, "").replace(/<span\sstyle\="font-weight\:400">/g, "");
    var tempString6 = tempString5.replace(/&nbsp;/g, " ").replace(/<br>/g, "\n").replace(/<h5>/g, "<p><b>").replace(/<\/h5>/g, "</b></p>").replace(/<span\sstyle\="color\:#[a-zA-Z0-9]{3}">/g, "").replace(/<span\sstyle\="color\:#[a-zA-Z0-9]{6}">/g, "");

    return tempString6;
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
    
    // Performance monitoring functions
    window.createPerformanceTimer = createPerformanceTimer;
    window.logPerformanceSummary = logPerformanceSummary;
    
    // Specialized utility functions
    window.getPactMagicSlots = getPactMagicSlots;
    window.getTotalAbilityScore = getTotalAbilityScore;
    window.processAbilityScoreBonuses = processAbilityScoreBonuses;
}