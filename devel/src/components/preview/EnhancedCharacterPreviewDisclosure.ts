/**
 * Enhanced Character Preview Disclosure with Validation Integration
 * 
 * Integrates the progressive disclosure system with real-time validation feedback,
 * providing users with detailed character conversion accuracy and missing data indicators.
 */

import Alpine from 'alpinejs';
import { DisclosureSection, ProgressiveDisclosureData } from '../disclosure/ProgressiveDisclosure';
import { 
  CharacterValidationReport, 
  SectionValidation, 
  ValidationResult,
  characterValidationEngine 
} from '../../domain/validation/CharacterValidationEngine';
import { ValidationIndicator } from './CharacterPreviewValidator';
import { ValidationUI } from './validation-ui';

export interface EnhancedDisclosureSection extends DisclosureSection {
  validation?: SectionValidation;
  validationIndicator?: ValidationIndicator;
  showValidationDetails: boolean;
  accuracyPercentage?: number;
  missingItems?: string[];
  suggestions?: string[];
}

export interface EnhancedCharacterPreviewData extends ProgressiveDisclosureData {
  // Validation integration
  validationReport: CharacterValidationReport | null;
  showValidationSummary: boolean;
  validationMode: 'inline' | 'detailed' | 'summary';
  
  // Character data
  characterData: any;
  sourceData: any;
  
  // Enhanced methods
  createEnhancedDisclosureSections(data: any, validationReport?: CharacterValidationReport): EnhancedDisclosureSection[];
  updateSectionValidation(sectionId: string, validation: SectionValidation): void;
  getValidationIndicatorForSection(section: EnhancedDisclosureSection): ValidationIndicator;
  formatValidationBadge(section: EnhancedDisclosureSection): string;
  handleValidationUpdate(event: CustomEvent): void;
  exportValidationReport(): void;
  toggleValidationMode(): void;
  retryValidation(): Promise<void>;
}

// Enhanced Character Preview Disclosure Alpine.js component
Alpine.data('enhancedCharacterPreviewDisclosure', (): EnhancedCharacterPreviewData => ({
  // Base disclosure properties
  sections: [],
  globalExpanded: false,
  activeAnimations: new Map(),
  allowMultiple: true,
  enableAnimations: true,
  loadContentOnExpand: false,
  
  // Validation properties
  validationReport: null,
  showValidationSummary: true,
  validationMode: 'inline',
  
  // Character data
  characterData: null,
  sourceData: null,

  // Initialize enhanced component
  init() {
    console.log('Enhanced Character Preview Disclosure initialized');
    
    // Listen for character data changes
    window.addEventListener('characterDataLoaded', async (event: CustomEvent) => {
      const characterData = event.detail;
      if (characterData) {
        this.characterData = characterData;
        this.sections = this.createEnhancedDisclosureSections(characterData);
      }
    });
    
    // Listen for validation completion
    window.addEventListener('characterValidationComplete', (event: CustomEvent) => {
      this.handleValidationUpdate(event);
    });
    
    // Listen for real-time section validation updates
    window.addEventListener('sectionValidationUpdate', (event: CustomEvent) => {
      const { sectionId, validation } = event.detail;
      this.updateSectionValidation(sectionId, validation);
    });
    
    // Listen for conversion errors
    window.addEventListener('characterConversionError', (event: CustomEvent) => {
      console.error('Character conversion error:', event.detail);
      // Reset validation state on conversion error
      this.validationReport = null;
      this.sections.forEach(section => {
        section.validation = undefined;
        section.validationIndicator = undefined;
      });
    });
  },

  // Create enhanced disclosure sections with validation integration
  createEnhancedDisclosureSections(data: any, validationReport?: CharacterValidationReport): EnhancedDisclosureSection[] {
    const sections: EnhancedDisclosureSection[] = [];

    // Character Identity Section
    const identitySection: EnhancedDisclosureSection = {
      id: 'character-identity',
      title: 'Character Identity',
      content: this.formatIdentityContent(data),
      expanded: false,
      loading: false,
      icon: '👤',
      badge: this.getCharacterLevelBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'identity'),
      validationIndicator: undefined
    };
    
    if (identitySection.validation) {
      identitySection.validationIndicator = this.getValidationIndicatorForSection(identitySection);
    }
    
    sections.push(identitySection);

    // Ability Scores Section
    const abilitiesSection: EnhancedDisclosureSection = {
      id: 'character-abilities',
      title: 'Ability Scores',
      content: this.formatAbilitiesContent(data),
      expanded: false,
      loading: false,
      icon: '🎲',
      badge: this.getAbilitiesBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'abilities'),
      validationIndicator: undefined
    };
    
    if (abilitiesSection.validation) {
      abilitiesSection.validationIndicator = this.getValidationIndicatorForSection(abilitiesSection);
    }
    
    sections.push(abilitiesSection);

    // Skills & Proficiencies Section
    const skillsSection: EnhancedDisclosureSection = {
      id: 'character-skills',
      title: 'Skills & Proficiencies',
      content: this.formatSkillsContent(data),
      expanded: false,
      loading: false,
      icon: '🎯',
      badge: this.getSkillsBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'skills'),
      validationIndicator: undefined
    };
    
    if (skillsSection.validation) {
      skillsSection.validationIndicator = this.getValidationIndicatorForSection(skillsSection);
    }
    
    sections.push(skillsSection);

    // Combat Statistics Section
    const combatSection: EnhancedDisclosureSection = {
      id: 'character-combat',
      title: 'Combat Statistics',
      content: this.formatCombatContent(data),
      expanded: false,
      loading: false,
      icon: '⚔️',
      badge: this.getCombatBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'combat'),
      validationIndicator: undefined
    };
    
    if (combatSection.validation) {
      combatSection.validationIndicator = this.getValidationIndicatorForSection(combatSection);
    }
    
    sections.push(combatSection);

    // Equipment Section
    const equipmentSection: EnhancedDisclosureSection = {
      id: 'character-equipment',
      title: 'Equipment & Inventory',
      content: this.formatEquipmentContent(data),
      expanded: false,
      loading: false,
      icon: '🎒',
      badge: this.getEquipmentBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'equipment'),
      validationIndicator: undefined
    };
    
    if (equipmentSection.validation) {
      equipmentSection.validationIndicator = this.getValidationIndicatorForSection(equipmentSection);
    }
    
    sections.push(equipmentSection);

    // Spells Section (if character has spells)
    if (data.spells && (data.spells.spellSlots || data.spells.knownSpells)) {
      const spellsSection: EnhancedDisclosureSection = {
        id: 'character-spells',
        title: 'Spells & Magic',
        content: this.formatSpellsContent(data),
        expanded: false,
        loading: false,
        icon: '✨',
        badge: this.getSpellsBadge(data),
        showValidationDetails: false,
        validation: validationReport?.sections.find(s => s.sectionId === 'spells'),
        validationIndicator: undefined
      };
      
      if (spellsSection.validation) {
        spellsSection.validationIndicator = this.getValidationIndicatorForSection(spellsSection);
      }
      
      sections.push(spellsSection);
    }

    // Features & Traits Section
    const featuresSection: EnhancedDisclosureSection = {
      id: 'character-features',
      title: 'Features & Traits',
      content: this.formatFeaturesContent(data),
      expanded: false,
      loading: false,
      icon: '⭐',
      badge: this.getFeaturesBadge(data),
      showValidationDetails: false,
      validation: validationReport?.sections.find(s => s.sectionId === 'features'),
      validationIndicator: undefined
    };
    
    if (featuresSection.validation) {
      featuresSection.validationIndicator = this.getValidationIndicatorForSection(featuresSection);
    }
    
    sections.push(featuresSection);

    return sections;
  },

  // Handle validation report updates
  handleValidationUpdate(event: CustomEvent): void {
    const { report } = event.detail;
    this.validationReport = report;
    
    // Update each section with validation data
    this.sections.forEach((section, index) => {
      const sectionValidation = report.sections.find(
        (v: SectionValidation) => this.matchSectionToValidation(section.id, v.sectionId)
      );
      
      if (sectionValidation) {
        this.sections[index].validation = sectionValidation;
        this.sections[index].validationIndicator = this.getValidationIndicatorForSection(section);
        this.sections[index].accuracyPercentage = sectionValidation.overallAccuracy;
        this.sections[index].missingItems = this.extractMissingItems(sectionValidation);
        this.sections[index].suggestions = this.extractSuggestions(sectionValidation);
      }
    });
    
    console.log('Validation update applied to sections:', this.sections.length);
  },

  // Update specific section validation
  updateSectionValidation(sectionId: string, validation: SectionValidation): void {
    const sectionIndex = this.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex >= 0) {
      this.sections[sectionIndex].validation = validation;
      this.sections[sectionIndex].validationIndicator = this.getValidationIndicatorForSection(this.sections[sectionIndex]);
      this.sections[sectionIndex].accuracyPercentage = validation.overallAccuracy;
      this.sections[sectionIndex].missingItems = this.extractMissingItems(validation);
      this.sections[sectionIndex].suggestions = this.extractSuggestions(validation);
    }
  },

  // Get validation indicator for a section
  getValidationIndicatorForSection(section: EnhancedDisclosureSection): ValidationIndicator {
    if (!section.validation) {
      return {
        status: 'loading',
        percentage: 0,
        message: 'Not validated',
        icon: 'help-circle',
        color: 'text-neutral-500'
      };
    }

    const validation = section.validation;
    
    return {
      status: validation.status,
      percentage: validation.overallAccuracy,
      message: this.formatValidationMessage(validation),
      icon: this.getValidationIcon(validation.status),
      color: this.getValidationColor(validation.status)
    };
  },

  // Format validation message for display
  formatValidationMessage(validation: SectionValidation): string {
    const { validated, missing, errored } = validation.itemCount;
    
    if (errored > 0) {
      return `${errored} error${errored > 1 ? 's' : ''}`;
    }
    
    if (missing > 0) {
      return `${missing} missing`;
    }
    
    if (validated > 0) {
      return `${validated} verified`;
    }
    
    return `${validation.overallAccuracy}% accuracy`;
  },

  // Get validation icon
  getValidationIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'success': 'check-circle',
      'warning': 'alert-triangle',
      'error': 'x-circle',
      'loading': 'loader'
    };
    return iconMap[status] || 'help-circle';
  },

  // Get validation color
  getValidationColor(status: string): string {
    const colorMap: Record<string, string> = {
      'success': 'text-success',
      'warning': 'text-warning',
      'error': 'text-error',
      'loading': 'text-secondary-500'
    };
    return colorMap[status] || 'text-neutral-500';
  },

  // Match section ID to validation ID
  matchSectionToValidation(sectionId: string, validationId: string): boolean {
    const mappings: Record<string, string> = {
      'character-identity': 'identity',
      'character-abilities': 'abilities',
      'character-skills': 'skills',
      'character-combat': 'combat',
      'character-equipment': 'equipment',
      'character-spells': 'spells',
      'character-features': 'features'
    };
    
    return mappings[sectionId] === validationId;
  },

  // Extract missing items from validation results
  extractMissingItems(validation: SectionValidation): string[] {
    const missingItems: string[] = [];
    
    validation.results.forEach(result => {
      if (result.missingData) {
        missingItems.push(...result.missingData);
      }
    });
    
    return [...new Set(missingItems)]; // Remove duplicates
  },

  // Extract suggestions from validation results
  extractSuggestions(validation: SectionValidation): string[] {
    const suggestions: string[] = [];
    
    validation.results.forEach(result => {
      if (result.suggestions) {
        suggestions.push(...result.suggestions);
      }
    });
    
    return [...new Set(suggestions)]; // Remove duplicates
  },

  // Format badge with validation status
  formatValidationBadge(section: EnhancedDisclosureSection): string {
    if (!section.validation) {
      return section.badge?.toString() || '';
    }
    
    const baseText = section.badge?.toString() || '';
    const accuracy = section.validation.overallAccuracy;
    
    if (accuracy < 70) {
      return `${baseText} ⚠️`;
    } else if (accuracy < 90) {
      return `${baseText} ⚠️`;
    } else {
      return `${baseText} ✅`;
    }
  },

  // Toggle validation mode
  toggleValidationMode(): void {
    const modes = ['inline', 'detailed', 'summary'];
    const currentIndex = modes.indexOf(this.validationMode);
    this.validationMode = modes[(currentIndex + 1) % modes.length];
    
    console.log('Validation mode changed to:', this.validationMode);
  },

  // Retry validation
  async retryValidation(): Promise<void> {
    if (!this.characterData) {
      console.warn('No character data available for validation retry');
      return;
    }
    
    try {
      const report = await characterValidationEngine.validateCharacter(
        this.characterData, 
        this.sourceData
      );
      
      this.validationReport = report;
      this.handleValidationUpdate({ detail: { report } } as CustomEvent);
      
    } catch (error) {
      console.error('Validation retry failed:', error);
    }
  },

  // Export validation report
  exportValidationReport(): void {
    if (!this.validationReport) {
      console.warn('No validation report to export');
      return;
    }
    
    const reportData = {
      ...this.validationReport,
      sections: this.sections.map(section => ({
        ...section,
        validation: section.validation
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.validationReport.characterName.replace(/\W/g, '_')}_enhanced_validation_report.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  // Base disclosure methods (inherited from ProgressiveDisclosureData)
  async toggleSection(sectionId: string): Promise<void> {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;

    section.expanded = !section.expanded;
    
    // Load content if needed
    if (section.expanded && this.loadContentOnExpand) {
      await this.loadSectionContent(sectionId);
    }
    
    // Trigger validation detail toggle if in detailed mode
    if (this.validationMode === 'detailed') {
      section.showValidationDetails = section.expanded;
    }
  },

  async expandAll(): Promise<void> {
    this.globalExpanded = true;
    for (const section of this.sections) {
      section.expanded = true;
      if (this.validationMode === 'detailed') {
        section.showValidationDetails = true;
      }
    }
  },

  async collapseAll(): Promise<void> {
    this.globalExpanded = false;
    for (const section of this.sections) {
      section.expanded = false;
      section.showValidationDetails = false;
    }
  },

  async loadSectionContent(sectionId: string): Promise<void> {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    section.loading = true;
    
    try {
      // Simulate content loading - in real implementation,
      // this would fetch additional data or run specific parsing
      await new Promise(resolve => setTimeout(resolve, 500));
      section.loading = false;
    } catch (error) {
      section.error = 'Failed to load section content';
      section.loading = false;
    }
  },

  handleKeydown(event: KeyboardEvent, sectionId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSection(sectionId);
    }
  },

  getSectionElement(sectionId: string): HTMLElement | null {
    return document.querySelector(`[data-section-id="${sectionId}"]`);
  },

  getContentElement(sectionId: string): HTMLElement | null {
    return document.querySelector(`[data-section-content="${sectionId}"]`);
  },

  async animateExpand(sectionId: string): Promise<void> {
    // Animation implementation would go here
  },

  async animateCollapse(sectionId: string): Promise<void> {
    // Animation implementation would go here
  },

  announceStateChange(sectionId: string, expanded: boolean): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const message = `${section.title} section ${expanded ? 'expanded' : 'collapsed'}`;
    
    // Create live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },

  // Content formatting methods (simplified for brevity)
  formatIdentityContent(data: any): any {
    return {
      type: 'identity',
      name: data?.name,
      race: data?.race,
      classes: data?.classes,
      level: this.calculateTotalLevel(data?.classes)
    };
  },

  formatAbilitiesContent(data: any): any {
    return {
      type: 'abilities',
      abilities: data?.abilities || {}
    };
  },

  formatSkillsContent(data: any): any {
    return {
      type: 'skills',
      skills: data?.skills || []
    };
  },

  formatCombatContent(data: any): any {
    return {
      type: 'combat',
      armorClass: data?.armorClass || data?.ac,
      hitPoints: data?.hitPoints || data?.hp,
      speed: data?.speed,
      proficiencyBonus: data?.proficiencyBonus
    };
  },

  formatEquipmentContent(data: any): any {
    return {
      type: 'equipment',
      equipment: data?.equipment || []
    };
  },

  formatSpellsContent(data: any): any {
    return {
      type: 'spells',
      spells: data?.spells || {}
    };
  },

  formatFeaturesContent(data: any): any {
    return {
      type: 'features',
      features: data?.features || []
    };
  },

  // Badge calculation methods
  calculateTotalLevel(classes: any[]): number {
    if (!Array.isArray(classes)) return 0;
    return classes.reduce((sum, c) => sum + (c?.level || 0), 0);
  },

  getCharacterLevelBadge(data: any): string {
    const level = this.calculateTotalLevel(data?.classes);
    return level > 0 ? `Level ${level}` : 'No Level';
  },

  getAbilitiesBadge(data: any): string {
    const abilities = data?.abilities || {};
    const abilityCount = Object.keys(abilities).length;
    return `${abilityCount}/6`;
  },

  getSkillsBadge(data: any): string {
    const skills = data?.skills || [];
    const proficient = skills.filter((s: any) => s?.proficient).length;
    return proficient.toString();
  },

  getCombatBadge(data: any): string {
    const ac = data?.armorClass || data?.ac;
    const hp = data?.hitPoints || data?.hp;
    return ac && hp ? `AC ${ac}, HP ${hp}` : 'Incomplete';
  },

  getEquipmentBadge(data: any): string {
    const equipment = data?.equipment || [];
    const total = equipment.reduce((sum: number, cat: any) => sum + (cat?.items?.length || 0), 0);
    return total.toString();
  },

  getSpellsBadge(data: any): string {
    const spells = data?.spells?.knownSpells || [];
    return spells.length.toString();
  },

  getFeaturesBadge(data: any): string {
    const features = data?.features || [];
    return features.length.toString();
  }
}));

// Export enhanced disclosure section type
export { EnhancedDisclosureSection, EnhancedCharacterPreviewData };