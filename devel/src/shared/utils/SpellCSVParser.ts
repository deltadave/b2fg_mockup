/**
 * SpellCSVParser - Parse spell data from CSV file
 * 
 * Reads the comprehensive spell database and provides mapping
 * of spells to their primary classes based on D&D 5e rules.
 */

// Browser-compatible CSV parser - no Node.js dependencies

export interface SpellClassMapping {
  name: string;
  classes: string[];
  primaryClass: string;
  level: string;
  school: string;
  source: string;
}

export class SpellCSVParser {
  private static spellMappings: Map<string, SpellClassMapping> | null = null;
  
  /**
   * Parse CSV and extract spell to class mappings
   * For browser environment, we'll use fetch to load the CSV
   */
  private static async parseCSV(): Promise<Map<string, SpellClassMapping>> {
    try {
      // In browser environment, try to fetch the CSV from public directory
      const response = await fetch('/data/spells.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch spells.csv: ${response.status}`);
      }
      
      const csvContent = await response.text();
      const lines = csvContent.split('\n');
      
      // Skip header row
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      const mappings = new Map<string, SpellClassMapping>();
      
      for (const line of dataLines) {
        const parsed = this.parseCSVLine(line);
        if (parsed && parsed.name) {
          // Extract classes from the classes column
          const classes = this.extractClasses(parsed.classes || '');
          const primaryClass = this.determinePrimaryClass(parsed.name, classes);
          
          mappings.set(parsed.name, {
            name: parsed.name,
            classes,
            primaryClass,
            level: parsed.level || '',
            school: parsed.school || '',
            source: parsed.source || ''
          });
        }
      }
      
      console.log(`📖 Loaded ${mappings.size} spells from CSV database`);
      return mappings;
      
    } catch (error) {
      console.warn('⚠️ Could not load spells.csv, CSV database unavailable:', error);
      return new Map();
    }
  }
  
  /**
   * Parse a single CSV line handling quoted fields properly
   */
  private static parseCSVLine(line: string): any {
    const result: any = {};
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    // Add the last field
    fields.push(current);
    
    // Map to expected structure based on CSV header
    if (fields.length >= 10) {
      result.name = fields[0]?.trim();
      result.source = fields[1]?.trim();
      result.page = fields[2]?.trim();
      result.level = fields[3]?.trim();
      result.castingTime = fields[4]?.trim();
      result.duration = fields[5]?.trim();
      result.school = fields[6]?.trim();
      result.range = fields[7]?.trim();
      result.components = fields[8]?.trim();
      result.classes = fields[9]?.trim();
      result.optionalClasses = fields[10]?.trim();
    }
    
    return result;
  }
  
  /**
   * Extract class names from the classes string
   */
  private static extractClasses(classString: string): string[] {
    if (!classString) return [];
    
    // Split by comma and extract class names
    const classes = new Set<string>();
    
    // Common patterns: "Cleric (PHB'24)", "Artificer (TCE)", etc.
    const classMatches = classString.match(/([A-Za-z]+)(?:\s*\([^)]+\))?/g);
    
    if (classMatches) {
      for (const match of classMatches) {
        const className = match.split('(')[0].trim();
        if (className && className !== 'Optional' && className !== 'Variant') {
          classes.add(className);
        }
      }
    }
    
    return Array.from(classes);
  }
  
  /**
   * Determine primary class based on class list and D&D 5e spell traditions
   */
  private static determinePrimaryClass(spellName: string, classes: string[]): string {
    if (classes.length === 0) return 'Wizard';
    if (classes.length === 1) return classes[0];
    
    // Class priority for multi-class spells based on D&D tradition
    const classPriority = [
      'Cleric',    // Divine magic
      'Druid',     // Primal magic
      'Paladin',   // Divine warrior
      'Ranger',    // Nature warrior
      'Warlock',   // Pact magic
      'Sorcerer',  // Innate magic
      'Bard',      // Learned magic
      'Wizard',    // Arcane magic
      'Artificer'  // Tech magic
    ];
    
    // Check for spell name patterns first
    const lowerName = spellName.toLowerCase();
    
    // Divine/healing spells favor Cleric
    if ((lowerName.includes('heal') || lowerName.includes('cure') || 
         lowerName.includes('bless') || lowerName.includes('sacred') ||
         lowerName.includes('divine') || lowerName.includes('holy')) && 
        classes.includes('Cleric')) {
      return 'Cleric';
    }
    
    // Nature spells favor Druid
    if ((lowerName.includes('animal') || lowerName.includes('plant') ||
         lowerName.includes('nature') || lowerName.includes('wild') ||
         lowerName.includes('thorn') || lowerName.includes('bark')) &&
        classes.includes('Druid')) {
      return 'Druid';
    }
    
    // Warlock exclusive patterns
    if ((lowerName.includes('eldritch') || lowerName.includes('hex') ||
         lowerName.includes('fiend') || lowerName.includes('patron')) &&
        classes.includes('Warlock')) {
      return 'Warlock';
    }
    
    // Bard exclusive patterns
    if ((lowerName.includes('vicious') || lowerName.includes('dissonant') ||
         lowerName.includes('bardic') || lowerName.includes('cutting')) &&
        classes.includes('Bard')) {
      return 'Bard';
    }
    
    // Return the highest priority class that's available
    for (const priorityClass of classPriority) {
      if (classes.includes(priorityClass)) {
        return priorityClass;
      }
    }
    
    // Fallback to first class
    return classes[0];
  }
  
  /**
   * Initialize the spell database
   */
  static async initialize(): Promise<void> {
    if (!this.spellMappings) {
      this.spellMappings = await this.parseCSV();
    }
  }
  
  /**
   * Get spell mapping by name (sync - requires initialize() to be called first)
   */
  static getSpellMapping(spellName: string): SpellClassMapping | null {
    if (!this.spellMappings) {
      console.warn('⚠️ SpellCSVParser not initialized. Call initialize() first.');
      return null;
    }
    
    return this.spellMappings.get(spellName) || null;
  }
  
  /**
   * Get primary class for a spell (sync - requires initialize() to be called first)
   */
  static getSpellPrimaryClass(spellName: string): string {
    const mapping = this.getSpellMapping(spellName);
    return mapping?.primaryClass || 'Wizard';
  }
  
  /**
   * Get all classes that can use a spell (sync - requires initialize() to be called first)
   */
  static getSpellClasses(spellName: string): string[] {
    const mapping = this.getSpellMapping(spellName);
    return mapping?.classes || [];
  }
  
  /**
   * Get all available spells (sync - requires initialize() to be called first)
   */
  static getAllSpells(): SpellClassMapping[] {
    if (!this.spellMappings) {
      console.warn('⚠️ SpellCSVParser not initialized. Call initialize() first.');
      return [];
    }
    
    return Array.from(this.spellMappings.values());
  }
  
  /**
   * Check if spell database is loaded
   */
  static isDatabaseLoaded(): boolean {
    return this.spellMappings !== null && this.spellMappings.size > 0;
  }
}