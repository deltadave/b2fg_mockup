/**
 * Progressive Disclosure Component
 * 
 * Core Alpine.js component for progressive disclosure functionality
 */

import Alpine from 'alpinejs';

export interface DisclosureSection {
  id: string;
  title: string;
  icon?: string;
  badge?: string;
  expanded: boolean;
  loading: boolean;
  error?: string;
  content?: {
    type: string;
    description?: string;
    html?: string;
    [key: string]: any;
  };
}

export interface ProgressiveDisclosureOptions {
  allowMultiple?: boolean;
  enableAnimations?: boolean;
  loadContentOnExpand?: boolean;
  persistState?: boolean;
}

export interface ProgressiveDisclosureData {
  sections: DisclosureSection[];
  options: ProgressiveDisclosureOptions;
  
  // Methods
  init(): void;
  toggleSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  expandAll(): void;
  collapseAll(): void;
  handleKeydown(event: KeyboardEvent, sectionId: string): void;
  getSectionById(sectionId: string): DisclosureSection | undefined;
  getExpandedSections(): DisclosureSection[];
  getCollapsedSections(): DisclosureSection[];
}

// Alpine.js component
Alpine.data('progressiveDisclosure', (
  sections: DisclosureSection[] = [],
  options: ProgressiveDisclosureOptions = {}
): ProgressiveDisclosureData => ({
  sections: sections || [],
  options: {
    allowMultiple: true,
    enableAnimations: true,
    loadContentOnExpand: false,
    persistState: false,
    ...options
  },

  init() {
    console.log('🔧 Progressive Disclosure initialized with', this.sections.length, 'sections');
    console.log('Options:', this.options);
    
    // Load persisted state if enabled
    if (this.options.persistState) {
      this.loadPersistedState();
    }
    
    // Set up event listeners
    this.setupEventListeners();
  },

  toggleSection(sectionId: string) {
    const section = this.getSectionById(sectionId);
    if (!section) {
      console.warn('Section not found:', sectionId);
      return;
    }

    if (section.expanded) {
      this.collapseSection(sectionId);
    } else {
      this.expandSection(sectionId);
    }
  },

  expandSection(sectionId: string) {
    const section = this.getSectionById(sectionId);
    if (!section) return;

    // If only single selection allowed, collapse others
    if (!this.options.allowMultiple) {
      this.sections.forEach(s => {
        if (s.id !== sectionId && s.expanded) {
          s.expanded = false;
          this.dispatchSectionEvent('collapsed', s);
        }
      });
    }

    section.expanded = true;
    this.dispatchSectionEvent('expanded', section);

    // Load content if needed
    if (this.options.loadContentOnExpand && !section.content) {
      this.loadSectionContent(sectionId);
    }

    // Persist state if enabled
    if (this.options.persistState) {
      this.persistState();
    }

    console.log(`📂 Section expanded: ${sectionId}`);
  },

  collapseSection(sectionId: string) {
    const section = this.getSectionById(sectionId);
    if (!section) return;

    section.expanded = false;
    this.dispatchSectionEvent('collapsed', section);

    // Persist state if enabled
    if (this.options.persistState) {
      this.persistState();
    }

    console.log(`📁 Section collapsed: ${sectionId}`);
  },

  expandAll() {
    if (!this.options.allowMultiple) {
      console.warn('Cannot expand all sections when allowMultiple is false');
      return;
    }

    this.sections.forEach(section => {
      if (!section.expanded) {
        section.expanded = true;
        this.dispatchSectionEvent('expanded', section);
      }
    });

    this.dispatchEvent('all-expanded');
    console.log('📂 All sections expanded');
  },

  collapseAll() {
    this.sections.forEach(section => {
      if (section.expanded) {
        section.expanded = false;
        this.dispatchSectionEvent('collapsed', section);
      }
    });

    this.dispatchEvent('all-collapsed');
    console.log('📁 All sections collapsed');
  },

  handleKeydown(event: KeyboardEvent, sectionId: string) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleSection(sectionId);
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextSection(sectionId);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousSection(sectionId);
        break;
      
      case 'Home':
        event.preventDefault();
        this.focusFirstSection();
        break;
      
      case 'End':
        event.preventDefault();
        this.focusLastSection();
        break;
    }
  },

  getSectionById(sectionId: string): DisclosureSection | undefined {
    return this.sections.find(s => s.id === sectionId);
  },

  getExpandedSections(): DisclosureSection[] {
    return this.sections.filter(s => s.expanded);
  },

  getCollapsedSections(): DisclosureSection[] {
    return this.sections.filter(s => !s.expanded);
  },

  // Private helper methods
  setupEventListeners() {
    // Listen for global disclosure events
    window.addEventListener('disclosure:expand-all', () => this.expandAll());
    window.addEventListener('disclosure:collapse-all', () => this.collapseAll());
  },

  async loadSectionContent(sectionId: string) {
    const section = this.getSectionById(sectionId);
    if (!section) return;

    section.loading = true;
    section.error = undefined;

    try {
      // Dispatch event to request content loading
      const event = new CustomEvent('disclosure:load-content', {
        detail: { sectionId, section }
      });
      window.dispatchEvent(event);

      // In a real implementation, this would load content from a service
      console.log(`🔄 Loading content for section: ${sectionId}`);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      section.error = error instanceof Error ? error.message : 'Failed to load content';
      console.error(`❌ Failed to load content for section ${sectionId}:`, error);
    } finally {
      section.loading = false;
    }
  },

  dispatchSectionEvent(action: string, section: DisclosureSection) {
    const event = new CustomEvent(`disclosure:section-${action}`, {
      detail: { section, sectionId: section.id }
    });
    window.dispatchEvent(event);
  },

  dispatchEvent(eventName: string) {
    const event = new CustomEvent(`disclosure:${eventName}`, {
      detail: { sections: this.sections }
    });
    window.dispatchEvent(event);
  },

  focusNextSection(currentSectionId: string) {
    const currentIndex = this.sections.findIndex(s => s.id === currentSectionId);
    const nextIndex = (currentIndex + 1) % this.sections.length;
    const nextSection = this.sections[nextIndex];
    
    if (nextSection) {
      this.focusSection(nextSection.id);
    }
  },

  focusPreviousSection(currentSectionId: string) {
    const currentIndex = this.sections.findIndex(s => s.id === currentSectionId);
    const prevIndex = currentIndex === 0 ? this.sections.length - 1 : currentIndex - 1;
    const prevSection = this.sections[prevIndex];
    
    if (prevSection) {
      this.focusSection(prevSection.id);
    }
  },

  focusFirstSection() {
    if (this.sections.length > 0) {
      this.focusSection(this.sections[0].id);
    }
  },

  focusLastSection() {
    if (this.sections.length > 0) {
      this.focusSection(this.sections[this.sections.length - 1].id);
    }
  },

  focusSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.focus();
    }
  },

  persistState() {
    if (!this.options.persistState) return;

    const state = {
      expandedSections: this.sections
        .filter(s => s.expanded)
        .map(s => s.id)
    };

    try {
      localStorage.setItem('disclosure-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist disclosure state:', error);
    }
  },

  loadPersistedState() {
    if (!this.options.persistState) return;

    try {
      const stateJson = localStorage.getItem('disclosure-state');
      if (!stateJson) return;

      const state = JSON.parse(stateJson);
      if (state.expandedSections && Array.isArray(state.expandedSections)) {
        this.sections.forEach(section => {
          section.expanded = state.expandedSections.includes(section.id);
        });
        console.log('📥 Disclosure state loaded from localStorage');
      }
    } catch (error) {
      console.warn('Failed to load persisted disclosure state:', error);
    }
  }
}));

console.log('🔧 Progressive Disclosure component registered');