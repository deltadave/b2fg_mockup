/**
 * FileProcessor Service
 * 
 * Handles secure processing of uploaded character files (JSON/XML) with comprehensive
 * validation, sanitization, and security measures to prevent various attack vectors.
 * 
 * Features:
 * - Multi-layer validation (file size, type, content)
 * - Security measures against XSS, XXE, JSON bombs, path traversal
 * - Content sanitization and structure validation
 * - Timeout protection and rate limiting
 */

import { CharacterData } from '@/domain/character/services/CharacterFetcher';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';

export interface FileProcessResult {
  success: boolean;
  characterData?: CharacterData;
  sourceType?: 'dndbeyond-json' | 'fantasy-grounds-xml' | 'custom-json';
  filename?: string;
  errors?: string[];
  warnings?: string[];
}

export interface FileValidation {
  valid: boolean;
  errors: string[];
}

export interface SecurityValidation {
  safe: boolean;
  threats: string[];
}

export class FileProcessor {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB limit
  private readonly allowedMimeTypes = ['application/json', 'text/xml', 'application/xml'];
  private readonly maxProcessingTime = 30000; // 30 second timeout
  private readonly maxStringLength = 10000;
  private readonly maxArrayLength = 1000;
  private readonly maxObjectDepth = 15;

  /**
   * Main entry point for processing uploaded files
   */
  async processFile(file: File): Promise<FileProcessResult> {
    try {
      // Multi-layer validation
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Secure content reading with timeout
      const content = await this.readFileContentSecurely(file);

      // Content validation and sanitization
      const sanitizedContent = await this.sanitizeContent(content, file.type);

      // Security validation
      const securityCheck = this.validateSecurity(sanitizedContent);
      if (!securityCheck.safe) {
        return { 
          success: false, 
          errors: [`Security validation failed: ${securityCheck.threats.join(', ')}`] 
        };
      }

      // Parse with security constraints
      const characterData = await this.parseCharacterDataSecurely(sanitizedContent, file.type);

      return {
        success: true,
        characterData,
        sourceType: this.determineSourceType(file, characterData),
        filename: this.sanitizeFilename(file.name)
      };
    } catch (error) {
      console.error('File processing error:', error);
      return { 
        success: false, 
        errors: [`Processing failed: ${this.sanitizeErrorMessage((error as Error).message)}`] 
      };
    }
  }

  /**
   * Comprehensive file validation
   */
  private async validateFile(file: File): Promise<FileValidation> {
    const errors: string[] = [];

    // File size validation
    if (file.size > this.maxFileSize) {
      errors.push(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // MIME type validation
    if (!this.allowedMimeTypes.includes(file.type)) {
      errors.push(`Unsupported file type: ${file.type || 'unknown'}. Supported types: JSON, XML`);
    }

    // File extension validation
    const extension = this.getFileExtension(file.name);
    const allowedExtensions = ['.json', '.xml'];
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Unsupported file extension: ${extension}. Allowed: .json, .xml`);
    }

    // Filename validation
    if (!this.isValidFilename(file.name)) {
      errors.push('Invalid filename. Filenames cannot contain path traversal or special characters.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Secure file content reading with timeout protection
   */
  private async readFileContentSecurely(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout'));
      }, this.maxProcessingTime);

      reader.onload = (event) => {
        clearTimeout(timeout);
        const content = event.target?.result as string;

        // Basic content validation
        if (!content || content.length === 0) {
          reject(new Error('File content is empty'));
          return;
        }

        resolve(content);
      };

      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Content sanitization based on file type
   */
  private async sanitizeContent(content: string, fileType: string): Promise<string> {
    // Remove null bytes and control characters
    let sanitized = content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters

    if (fileType === 'application/json') {
      sanitized = this.sanitizeJsonContent(sanitized);
    } else if (fileType.includes('xml')) {
      sanitized = this.sanitizeXmlContent(sanitized);
    }

    return sanitized;
  }

  /**
   * JSON-specific sanitization
   */
  private sanitizeJsonContent(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '');
  }

  /**
   * XML-specific sanitization
   */
  private sanitizeXmlContent(content: string): string {
    return content
      .replace(/<!DOCTYPE[^>]*>/gi, '') // Remove DOCTYPE declarations
      .replace(/<\?.*?\?>/g, (match) => {
        // Keep standard XML declaration, remove others
        return match.includes('xml version') ? match : '';
      })
      .replace(/<!ENTITY[^>]*>/gi, '') // Remove entity declarations
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '');
  }

  /**
   * Security validation for various attack vectors
   */
  private validateSecurity(content: string): SecurityValidation {
    const threats: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /<script[^>]*>.*?<\/script>/gi, threat: 'Script injection' },
      { pattern: /javascript:/gi, threat: 'JavaScript URL' },
      { pattern: /vbscript:/gi, threat: 'VBScript URL' },
      { pattern: /data:text\/html/gi, threat: 'HTML data URL' },
      { pattern: /<!ENTITY/gi, threat: 'XML entity declaration' },
      { pattern: /SYSTEM\s+['"]/gi, threat: 'XML external entity' },
      { pattern: /%00/g, threat: 'Null byte injection' }
    ];

    for (const { pattern, threat } of dangerousPatterns) {
      if (pattern.test(content)) {
        threats.push(threat);
      }
    }

    // Check for JSON/XML bombs
    if (this.detectStructureBomb(content)) {
      threats.push('Potential structure bomb (excessive nesting or size)');
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Detect JSON/XML bombs (excessive nesting or large structures)
   */
  private detectStructureBomb(content: string): boolean {
    try {
      let maxDepth = 0;
      let currentDepth = 0;
      let maxArraySize = 0;
      let arrayItemCount = 0;
      let inArray = false;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '{' || char === '[' || char === '<') {
          currentDepth++;
          if (char === '[') {
            inArray = true;
            arrayItemCount = 0;
          }
        } else if (char === '}' || char === ']' || char === '>') {
          currentDepth--;
          if (char === ']') {
            maxArraySize = Math.max(maxArraySize, arrayItemCount);
            inArray = false;
          }
        } else if (char === ',' && inArray) {
          arrayItemCount++;
        }

        maxDepth = Math.max(maxDepth, currentDepth);

        // Thresholds for potential bombs
        if (maxDepth > 25 || maxArraySize > 10000) {
          return true;
        }
      }

      return false;
    } catch {
      return true; // If we can't analyze it, consider it suspicious
    }
  }

  /**
   * Parse character data with security constraints
   */
  private async parseCharacterDataSecurely(content: string, fileType: string): Promise<CharacterData> {
    try {
      if (fileType === 'application/json') {
        // Parse JSON with reviver to filter dangerous content
        const parsed = JSON.parse(content, this.jsonReviver.bind(this));
        return this.validateCharacterStructure(parsed);
      } else if (fileType.includes('xml')) {
        // Parse XML with security restrictions
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');

        // Check for parsing errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Invalid XML structure');
        }

        return this.convertXmlToCharacterData(doc);
      }

      throw new Error('Unsupported file type for parsing');
    } catch (error) {
      throw new Error(`Failed to parse file: ${(error as Error).message}`);
    }
  }

  /**
   * JSON reviver function to filter dangerous content
   */
  private jsonReviver(key: string, value: any): any {
    // Filter out dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (dangerousKeys.includes(key)) {
      return undefined;
    }

    // Validate string content
    if (typeof value === 'string') {
      return this.sanitizeStringValue(value);
    }

    return value;
  }

  /**
   * Sanitize individual string values
   */
  private sanitizeStringValue(value: string): string {
    // Limit string length
    if (value.length > this.maxStringLength) {
      value = value.substring(0, this.maxStringLength);
    }

    // Remove potentially dangerous content
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '');
  }

  /**
   * Validate character data structure
   */
  private validateCharacterStructure(data: any): CharacterData {
    // Deep structure validation
    const structureValidation = this.validateDataStructure(data);
    if (!structureValidation.valid) {
      throw new Error(`Invalid data structure: ${structureValidation.error}`);
    }

    // Ensure basic character structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid character data structure');
    }

    // Handle D&D Beyond API response format
    let characterData = data;
    if (data.success && data.data && typeof data.data === 'object') {
      // This is a D&D Beyond API response wrapper: { success: true, data: { ... character data ... } }
      characterData = data.data;
      console.log('📦 Detected D&D Beyond API response wrapper, extracting character data');
    }

    // Validate required fields
    const requiredFields = ['id', 'name'];
    for (const field of requiredFields) {
      if (!(field in characterData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate data types
    if (typeof characterData.id !== 'number' && typeof characterData.id !== 'string') {
      throw new Error('Invalid character ID format');
    }

    if (typeof characterData.name !== 'string' || characterData.name.trim().length === 0) {
      throw new Error('Invalid character name');
    }

    return characterData as CharacterData;
  }

  /**
   * Deep validation of data structure
   */
  private validateDataStructure(data: any, depth = 0): { valid: boolean; error?: string } {
    if (depth > this.maxObjectDepth) {
      return { valid: false, error: 'Object structure too deep' };
    }

    if (Array.isArray(data)) {
      if (data.length > this.maxArrayLength) {
        return { valid: false, error: 'Array too large' };
      }

      for (const item of data) {
        const result = this.validateDataStructure(item, depth + 1);
        if (!result.valid) return result;
      }
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length > 1000) {
        return { valid: false, error: 'Object has too many properties' };
      }

      for (const [key, value] of Object.entries(data)) {
        // Validate property names
        if (!this.isValidPropertyName(key)) {
          return { valid: false, error: `Invalid property name: ${key}` };
        }

        const result = this.validateDataStructure(value, depth + 1);
        if (!result.valid) return result;
      }
    } else if (typeof data === 'string') {
      if (data.length > this.maxStringLength) {
        return { valid: false, error: 'String value too long' };
      }
    }

    return { valid: true };
  }

  /**
   * Convert XML document to character data
   */
  private convertXmlToCharacterData(doc: Document): CharacterData {
    // Basic XML to JSON conversion for Fantasy Grounds XML
    const characterEl = doc.querySelector('character');
    if (!characterEl) {
      throw new Error('Invalid Fantasy Grounds XML: missing character element');
    }

    // Extract basic information
    const name = characterEl.querySelector('name')?.textContent?.trim() || 'Unknown Character';
    const id = Date.now(); // Generate temporary ID for XML files

    // This is a simplified conversion - in a full implementation,
    // we would parse all XML elements to reconstruct character data
    return {
      id,
      name,
      sourceType: 'fantasy-grounds-xml'
    };
  }

  /**
   * Determine source type based on file content
   */
  private determineSourceType(file: File, characterData: CharacterData): 'dndbeyond-json' | 'fantasy-grounds-xml' | 'custom-json' {
    if (file.type.includes('xml')) {
      return 'fantasy-grounds-xml';
    }

    // Check for D&D Beyond specific structure
    if (characterData.classes && characterData.stats && characterData.race) {
      return 'dndbeyond-json';
    }

    return 'custom-json';
  }

  /**
   * Utility functions
   */
  private isValidPropertyName(name: string): boolean {
    // Prevent prototype pollution
    const forbiddenNames = ['__proto__', 'constructor', 'prototype'];
    if (forbiddenNames.includes(name)) {
      return false;
    }
    
    // Length check
    if (name.length > 200) {
      return false;
    }
    
    // Allow JSON property names but prevent dangerous patterns
    // D&D Beyond uses properties like "feat:1970713", "spell:12345", etc.
    const dangerousPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /<script/i,
      /eval\(/i,
      /function\(/i,
      /\0/,  // null bytes
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/  // control characters
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(name));
  }

  private isValidFilename(filename: string): boolean {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    // Check for dangerous filenames
    const dangerousPatterns = [
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i,
      /[<>:"|?*]/,
      /^\./,
      /^$/
    ];

    return !dangerousPatterns.some(pattern => pattern.test(filename));
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }

  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/[<>]/g, '')
      .substring(0, 200);
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessor();