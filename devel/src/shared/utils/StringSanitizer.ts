/**
 * StringSanitizer Service
 * 
 * Provides utilities for string sanitization, HTML entity encoding, and XSS prevention.
 * Migrated from utilities.js fixQuote() function with modern TypeScript implementation
 * and enhanced security features.
 */

export interface SanitizationOptions {
  maxLength?: number;
  allowNewlines?: boolean;
  allowTabs?: boolean;
  preserveSpaces?: boolean;
  removeEventHandlers?: boolean;
  removeDangerousProtocols?: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  originalLength: number;
  finalLength: number;
  removedPatterns: string[];
}

export class StringSanitizer {
  /**
   * Comprehensive HTML entity encoding for XSS prevention
   * Migrated from legacy fixQuote() function with enhanced capabilities
   * 
   * @param input - Input string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized and encoded string
   */
  static sanitizeForXML(input: unknown, options: SanitizationOptions = {}): string {
    // Enhanced security: strict input validation
    if (input === null || input === undefined || input === "") {
      return "";
    }
    
    // Convert to string if not already
    const inputString = String(input);
    
    const {
      maxLength = 1000,
      allowNewlines = false,
      allowTabs = false,
      preserveSpaces = true,
      removeEventHandlers = true,
      removeDangerousProtocols = true
    } = options;
    
    // Additional sanitization based on options (before encoding to preserve patterns)
    let tempString = inputString;
    
    if (removeDangerousProtocols) {
      tempString = tempString
        .replace(/javascript:/gi, "")  // Remove javascript: protocols
        .replace(/vbscript:/gi, "")    // Remove vbscript: protocols
        .replace(/data:/gi, "");       // Remove data: protocols
    }
    
    if (removeEventHandlers) {
      tempString = tempString.replace(/on\w+\s*=/gi, ""); // Remove event handlers
    }
    
    // Handle whitespace based on options (before control character removal)
    if (!allowNewlines) {
      tempString = tempString.replace(/\n/g, " ");   // Replace newlines with spaces
      tempString = tempString.replace(/\r/g, " ");   // Replace carriage returns
    }
    
    if (!allowTabs) {
      tempString = tempString.replace(/\t/g, " ");   // Replace tabs
    }
    
    // Remove control characters but preserve allowed whitespace
    if (allowNewlines && allowTabs) {
      tempString = tempString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    } else if (allowNewlines) {
      tempString = tempString.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
    } else if (allowTabs) {
      tempString = tempString.replace(/[\x00-\x08\x0A\x0B\x0C\x0D\x0E-\x1F\x7F]/g, "");
    } else {
      tempString = tempString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    }
    
    // Comprehensive HTML entity encoding for security
    tempString = tempString
      .replace(/&/g, "&amp;")      // Must be first to avoid double-encoding
      .replace(/</g, "&lt;")       // Prevent HTML injection
      .replace(/>/g, "&gt;")       // Prevent HTML injection
      .replace(/"/g, "&quot;")     // Prevent attribute injection
      .replace(/'/g, "&#39;")      // Prevent attribute injection
      .replace(/=/g, "&#x3D;")     // Equal sign for attribute safety
      .replace(/\//g, "&#x2F;");   // Forward slash for extra safety
    
    // Apply length limit and normalize spaces
    tempString = tempString.substring(0, maxLength);
    
    if (preserveSpaces) {
      return tempString.trim();
    } else {
      return tempString.replace(/\s+/g, " ").trim();
    }
  }

  /**
   * Enhanced sanitization with detailed reporting
   * 
   * @param input - Input string to sanitize
   * @param options - Sanitization options
   * @returns Detailed sanitization result
   */
  static sanitizeWithReport(input: unknown, options: SanitizationOptions = {}): SanitizationResult {
    if (input === null || input === undefined || input === "") {
      return {
        sanitized: "",
        wasModified: false,
        originalLength: 0,
        finalLength: 0,
        removedPatterns: []
      };
    }

    const inputString = String(input);
    const originalLength = inputString.length;
    const removedPatterns: string[] = [];

    // Track what gets removed for security audit purposes
    let tempString = inputString;

    // Check for dangerous patterns before sanitization
    if (/javascript:/gi.test(tempString)) {
      removedPatterns.push('javascript: protocol');
    }
    if (/vbscript:/gi.test(tempString)) {
      removedPatterns.push('vbscript: protocol');
    }
    if (/data:/gi.test(tempString)) {
      removedPatterns.push('data: protocol');
    }
    if (/on\w+\s*=/gi.test(tempString)) {
      removedPatterns.push('event handlers');
    }
    if (/[\x00-\x1F\x7F]/.test(tempString)) {
      removedPatterns.push('control characters');
    }

    const sanitized = this.sanitizeForXML(input, options);
    
    return {
      sanitized,
      wasModified: sanitized !== inputString,
      originalLength,
      finalLength: sanitized.length,
      removedPatterns
    };
  }

  /**
   * Sanitize for HTML content while preserving some formatting
   * Based on legacy fixDesc() function but simplified for modern use
   * 
   * @param input - Input HTML string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized HTML string
   */
  static sanitizeHTML(input: unknown, options: SanitizationOptions = {}): string {
    if (input === null || input === undefined || input === "") {
      return "";
    }

    const {
      maxLength = 10000,
      allowNewlines = true,
      allowTabs = false
    } = options;

    // Convert to string and apply initial length limit
    let inputString = String(input).substring(0, maxLength);

    // Step 1: Decode common HTML entities to normalize content
    let tempString = inputString
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, "/");

    // Step 2: Typography improvements - smart quotes and dashes
    tempString = tempString
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")  // Convert em dash to hyphen
      .replace(/&#34;/g, '"')
      .replace(/&nbsp;/g, " ");

    // Step 3: Clean up dangerous elements and scripts
    tempString = tempString
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")   // Remove styles
      .replace(/\s*on\w+\s*=\s*[^>\s]*/gi, "")          // Remove event handlers with whitespace
      .replace(/javascript:/gi, "")                        // Remove javascript:
      .replace(/vbscript:/gi, "");                         // Remove vbscript:

    // Step 4: Handle whitespace
    if (!allowNewlines) {
      tempString = tempString.replace(/\n/g, " ").replace(/\r/g, " ");
    }
    
    if (!allowTabs) {
      tempString = tempString.replace(/\t/g, " ");
    }

    // Step 5: Final cleanup - normalize spaces only if not preserving newlines/tabs
    if (!allowNewlines && !allowTabs) {
      tempString = tempString.replace(/\s+/g, " ");
    }
    
    return tempString
      .trim()
      .substring(0, maxLength);
  }

  /**
   * Simple text sanitization for basic string cleaning
   * 
   * @param input - Input string
   * @param options - Sanitization options
   * @returns Clean text string
   */
  static sanitizeText(input: unknown, options: SanitizationOptions = {}): string {
    if (input === null || input === undefined || input === "") {
      return "";
    }

    const {
      maxLength = 1000,
      allowNewlines = false,
      allowTabs = false
    } = options;

    let text = String(input);

    // Handle whitespace before removing control characters
    if (!allowNewlines) {
      text = text.replace(/[\n\r]/g, " ");
    }
    
    if (!allowTabs) {
      text = text.replace(/\t/g, " ");
    }

    // Remove control characters but preserve allowed whitespace
    if (allowNewlines && allowTabs) {
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    } else if (allowNewlines) {
      text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
    } else if (allowTabs) {
      text = text.replace(/[\x00-\x08\x0A\x0B\x0C\x0D\x0E-\x1F\x7F]/g, "");
    } else {
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    }

    // Apply length limit first, then normalize spaces if needed
    text = text.substring(0, maxLength);
    
    // Only normalize spaces if we don't allow newlines/tabs  
    if (!allowNewlines && !allowTabs) {
      text = text.replace(/\s+/g, " ");
    }
    
    return text.trim();
  }

  /**
   * Escape string for use in XML attributes
   * 
   * @param input - Input string
   * @returns XML-safe attribute value
   */
  static escapeXMLAttribute(input: unknown): string {
    if (input === null || input === undefined || input === "") {
      return "";
    }

    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Validate that a string is safe for XML content
   * 
   * @param input - String to validate
   * @returns true if string appears safe for XML
   */
  static isXMLSafe(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return true; // Empty/null is safe
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<script/gi,
      /<iframe/gi,
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/  // Control characters except \t, \n, \r
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Convert common Unicode characters to ASCII equivalents
   * Useful for ensuring compatibility across different systems
   * 
   * @param input - Input string
   * @returns String with ASCII equivalents
   */
  static normalizeToASCII(input: unknown): string {
    if (input === null || input === undefined || input === "") {
      return "";
    }

    return String(input)
      .replace(/[\u2018\u2019]/g, "'")     // Smart quotes to straight quotes (left and right single)
      .replace(/[\u201c\u201d]/g, '"')     // Smart quotes to straight quotes (left and right double)
      .replace(/[\u2013\u2014]/g, "-")     // Em/en dashes to hyphens
      .replace(/[\u2026]/g, "...")         // Ellipsis to three dots
      .replace(/[àáâãäå]/g, "a")  // Accented a (lowercase)
      .replace(/[ÀÁÂÃÄÅ]/g, "A")  // Accented A (uppercase)
      .replace(/[èéêë]/g, "e")    // Accented e (lowercase)
      .replace(/[ÈÉÊË]/g, "E")    // Accented E (uppercase)
      .replace(/[ìíîï]/g, "i")    // Accented i (lowercase)
      .replace(/[ÌÍÎÏ]/g, "I")    // Accented I (uppercase)
      .replace(/[òóôõö]/g, "o")   // Accented o (lowercase)
      .replace(/[ÒÓÔÕÖ]/g, "O")   // Accented O (uppercase)
      .replace(/[ùúûü]/g, "u")    // Accented u (lowercase)
      .replace(/[ÙÚÛÜ]/g, "U")    // Accented U (uppercase)
      .replace(/[ñ]/g, "n")       // Accented n (lowercase)
      .replace(/[Ñ]/g, "N")       // Accented N (uppercase)
      .replace(/[ç]/g, "c")       // Accented c (lowercase)
      .replace(/[Ç]/g, "C");      // Accented C (uppercase)
  }
}

// Legacy compatibility function for gradual migration
export function fixQuote(badString: unknown): string {
  return StringSanitizer.sanitizeForXML(badString);
}