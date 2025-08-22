// Progressive Disclosure System - Main Export
// Complete disclosure system with animations, accessibility, and character preview integration

export { 
  DisclosureSection, 
  ProgressiveDisclosureData 
} from './ProgressiveDisclosure';

export {
  DisclosureAnimationController,
  DisclosureAnimationOptions,
  DisclosureElements,
  createDisclosureAnimationController,
  disclosureAnimations,
  getDisclosureAnimationController
} from '../../design-system/animations/disclosure-animations';

export {
  CharacterData,
  CharacterPreviewDisclosureData,
  sampleCharacterData
} from './CharacterPreviewDisclosure';

export {
  DisclosureAccessibilityEnhancer,
  AccessibilityEnhancementOptions,
  getDisclosureAccessibilityEnhancer
} from './accessibility-enhancements';

// Main setup function for the progressive disclosure system
export function setupProgressiveDisclosureSystem(options: {
  enableAnimations?: boolean;
  enableAccessibilityEnhancements?: boolean;
  enableCharacterPreview?: boolean;
} = {}) {
  const {
    enableAnimations = true,
    enableAccessibilityEnhancements = true, 
    enableCharacterPreview = true
  } = options;

  console.log('🔧 Setting up Progressive Disclosure System');

  // Import and register Alpine.js components
  const initializeComponents = async () => {
    try {
      // Import progressive disclosure component
      await import('./ProgressiveDisclosure');
      console.log('✅ ProgressiveDisclosure component loaded');

      // Import character preview component if enabled
      if (enableCharacterPreview) {
        await import('./CharacterPreviewDisclosure');
        console.log('✅ CharacterPreviewDisclosure component loaded');
      }

      // Initialize animations if enabled
      if (enableAnimations) {
        const { getDisclosureAnimationController } = await import('../../design-system/animations/disclosure-animations');
        const animationController = getDisclosureAnimationController();
        console.log('✅ Disclosure animations initialized');
        
        // Make available globally for debugging
        (window as any).disclosureAnimations = animationController;
      }

      // Initialize accessibility enhancements if enabled
      if (enableAccessibilityEnhancements) {
        const { getDisclosureAccessibilityEnhancer } = await import('./accessibility-enhancements');
        const accessibilityEnhancer = getDisclosureAccessibilityEnhancer();
        console.log('✅ Accessibility enhancements initialized');
        
        // Validate accessibility on setup
        const validation = accessibilityEnhancer.validateAccessibility();
        if (validation.passed) {
          console.log('✅ Accessibility validation passed');
        } else {
          console.warn('⚠️ Accessibility issues found:', validation.issues);
          if (validation.recommendations.length > 0) {
            console.info('💡 Recommendations:', validation.recommendations);
          }
        }
      }

      console.log('🎉 Progressive Disclosure System fully initialized');

    } catch (error) {
      console.error('❌ Error initializing Progressive Disclosure System:', error);
    }
  };

  // Initialize immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents);
  } else {
    initializeComponents();
  }

  return {
    // Utility functions for external use
    validateAccessibility: () => {
      import('./accessibility-enhancements').then(({ getDisclosureAccessibilityEnhancer }) => {
        const enhancer = getDisclosureAccessibilityEnhancer();
        return enhancer.validateAccessibility();
      });
    },
    
    getPerformanceMetrics: () => {
      if (enableAnimations) {
        import('../../design-system/animations/disclosure-animations').then(({ getDisclosureAnimationController }) => {
          const controller = getDisclosureAnimationController();
          return controller.getPerformanceMetrics();
        });
      }
      return Promise.resolve({ activeAnimations: 0, activeSections: 0 });
    }
  };
}

// CSS class utilities for custom implementations
export const DISCLOSURE_CLASSES = {
  // Container classes
  DISCLOSURE: 'disclosure',
  DISCLOSURE_GROUP: 'disclosure-group',
  DISCLOSURE_EXPANDED: 'expanded',
  DISCLOSURE_LOADING: 'disclosure-loading',
  DISCLOSURE_ERROR: 'disclosure-error',

  // Trigger classes
  TRIGGER: 'disclosure-trigger',
  TRIGGER_CONTENT: 'disclosure-trigger-content',
  TRIGGER_ICON: 'disclosure-trigger-icon',
  TRIGGER_TITLE: 'disclosure-trigger-title',
  TRIGGER_SUBTITLE: 'disclosure-trigger-subtitle',
  TRIGGER_BADGE: 'disclosure-trigger-badge',

  // Chevron classes
  CHEVRON: 'disclosure-chevron',
  CHEVRON_PLUS_MINUS: 'plus-minus',

  // Content classes
  CONTENT: 'disclosure-content',
  CONTENT_INNER: 'disclosure-content-inner',
  CONTENT_LOADING: 'disclosure-content-loading',
  CONTENT_ERROR: 'disclosure-content-error',

  // Loading states
  LOADING_SPINNER: 'disclosure-loading-spinner',

  // Character preview specific
  SKILLS: 'disclosure-skills',
  EQUIPMENT: 'disclosure-equipment',
  SPELLS: 'disclosure-spells',
  FEATURES: 'disclosure-features'
} as const;

// Event names for integration
export const DISCLOSURE_EVENTS = {
  SECTION_EXPANDED: 'disclosure:section-expanded',
  SECTION_COLLAPSED: 'disclosure:section-collapsed',
  ALL_EXPANDED: 'disclosure:all-expanded',
  ALL_COLLAPSED: 'disclosure:all-collapsed',
  LOADING_STARTED: 'disclosure:loading-started',
  LOADING_COMPLETED: 'disclosure:loading-completed',
  ERROR_OCCURRED: 'disclosure:error-occurred'
} as const;

// Alpine.js data attribute patterns
export const ALPINE_PATTERNS = {
  PROGRESSIVE_DISCLOSURE: 'x-data="progressiveDisclosure(...)"',
  CHARACTER_PREVIEW: 'x-data="characterPreviewDisclosure()"',
  TOGGLE_SECTION: '@click="toggleSection($sectionId)"',
  KEYBOARD_HANDLER: '@keydown="handleKeydown($event, $sectionId)"',
  EXPAND_ALL: '@click="expandAll()"',
  COLLAPSE_ALL: '@click="collapseAll()"'
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  animations: {
    duration: 350,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    enableChevronRotation: true,
    enableContentFade: true,
    enableHeightAnimation: true
  },
  accessibility: {
    enableLiveRegionAnnouncements: true,
    enableKeyboardShortcuts: true,
    enableFocusManagement: true,
    enableScreenReaderOptimization: true,
    announceContentSummary: true,
    announceLoadingStates: true
  },
  disclosure: {
    allowMultiple: true,
    enableAnimations: true,
    loadContentOnExpand: false
  }
} as const;

// Usage examples and documentation
export const USAGE_EXAMPLES = {
  basic: `
<!-- Basic Progressive Disclosure -->
<div x-data="progressiveDisclosure([{
  id: 'example',
  title: 'Example Section',
  content: { type: 'html', html: '<p>Content here</p>' },
  expanded: false
}])">
  <div class="disclosure">
    <button class="disclosure-trigger" 
            @click="toggleSection('example')"
            :aria-expanded="sections[0]?.expanded">
      <span class="disclosure-trigger-title">Example Section</span>
      <div class="disclosure-chevron"></div>
    </button>
    <div class="disclosure-content" x-show="sections[0]?.expanded">
      <div class="disclosure-content-inner">
        <p>Content here</p>
      </div>
    </div>
  </div>
</div>
  `,

  characterPreview: `
<!-- Character Preview Integration -->
<div x-data="characterPreviewDisclosure()">
  <div x-data="progressiveDisclosure(sections, { allowMultiple: true })">
    <template x-for="section in sections" :key="section.id">
      <div class="disclosure" :class="'disclosure-' + section.id.replace('character-', '')">
        <button class="disclosure-trigger" 
                @click="toggleSection(section.id)"
                :aria-expanded="section.expanded">
          <div class="disclosure-trigger-content">
            <span class="disclosure-trigger-icon" x-text="section.icon"></span>
            <span class="disclosure-trigger-title" x-text="section.title"></span>
          </div>
          <span class="disclosure-trigger-badge" x-text="section.badge"></span>
          <div class="disclosure-chevron"></div>
        </button>
        <div class="disclosure-content" x-show="section.expanded">
          <div class="disclosure-content-inner">
            <!-- Content rendered based on section type -->
          </div>
        </div>
      </div>
    </template>
  </div>
</div>
  `,

  accordionStyle: `
<!-- Accordion Style (Single Selection) -->
<div x-data="progressiveDisclosure(sections, { allowMultiple: false })">
  <div class="disclosure-group">
    <template x-for="section in sections" :key="section.id">
      <div class="disclosure">
        <button class="disclosure-trigger" 
                @click="toggleSection(section.id)"
                @keydown="handleKeydown($event, section.id)">
          <span x-text="section.title"></span>
          <div class="disclosure-chevron plus-minus"></div>
        </button>
        <div class="disclosure-content" x-show="section.expanded">
          <div class="disclosure-content-inner" x-html="section.content?.html">
          </div>
        </div>
      </div>
    </template>
  </div>
</div>
  `
} as const;

// Export everything for comprehensive usage
export default {
  setupProgressiveDisclosureSystem,
  DISCLOSURE_CLASSES,
  DISCLOSURE_EVENTS,
  ALPINE_PATTERNS,
  DEFAULT_CONFIG,
  USAGE_EXAMPLES
};