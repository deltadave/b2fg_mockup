// Accessibility Infrastructure for WCAG AA Compliance
// Provides comprehensive accessibility support including ARIA management, keyboard navigation, and screen reader optimization

export interface AccessibilityOptions {
  announceDelays?: {
    polite: number;
    assertive: number;
  };
  keyboardNavigation?: boolean;
  focusManagement?: boolean;
  screenReaderOptimization?: boolean;
  highContrastSupport?: boolean;
}

export interface FocusTrappingOptions {
  initialFocus?: HTMLElement | string;
  finalFocus?: HTMLElement | string;
  escapeKeyAction?: () => void;
  preventScroll?: boolean;
}

export interface AccessibilityMetrics {
  totalElements: number;
  accessibleElements: number;
  missingLabels: number;
  insufficientContrast: number;
  keyboardInaccessible: number;
  complianceScore: number;
}

export class LiveRegionManager {
  private politeRegion: HTMLElement;
  private assertiveRegion: HTMLElement;
  private announceQueue: Array<{text: string; priority: 'polite' | 'assertive'; delay: number}> = [];
  private isAnnouncing = false;

  constructor(private options: AccessibilityOptions) {
    this.createLiveRegions();
  }

  private createLiveRegions(): void {
    // Polite live region (won't interrupt screen reader)
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('class', 'sr-only');
    this.politeRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    // Assertive live region (will interrupt screen reader)
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.setAttribute('class', 'sr-only');
    this.assertiveRegion.style.cssText = this.politeRegion.style.cssText;

    document.body.appendChild(this.politeRegion);
    document.body.appendChild(this.assertiveRegion);
  }

  announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const delay = this.options.announceDelays?.[priority] || (priority === 'polite' ? 100 : 0);
    
    this.announceQueue.push({ text, priority, delay });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isAnnouncing || this.announceQueue.length === 0) {
      return;
    }

    this.isAnnouncing = true;

    while (this.announceQueue.length > 0) {
      const { text, priority, delay } = this.announceQueue.shift()!;
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const region = priority === 'polite' ? this.politeRegion : this.assertiveRegion;
      
      // Clear previous announcement
      region.textContent = '';
      
      // Small delay to ensure screen reader notices the change
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Set new announcement
      region.textContent = text;
      
      // Wait for announcement to be processed
      await new Promise(resolve => setTimeout(resolve, priority === 'polite' ? 500 : 200));
    }

    this.isAnnouncing = false;
  }

  clear(): void {
    this.politeRegion.textContent = '';
    this.assertiveRegion.textContent = '';
    this.announceQueue = [];
    this.isAnnouncing = false;
  }
}

export class FocusManager {
  private focusStack: HTMLElement[] = [];
  private focusTrappingEnabled = false;
  private currentTrapContainer?: HTMLElement;
  private firstFocusableElement?: HTMLElement;
  private lastFocusableElement?: HTMLElement;

  // CSS selector for focusable elements
  private readonly focusableSelector = `
    a[href]:not([tabindex='-1']),
    area[href]:not([tabindex='-1']),
    input:not([disabled]):not([tabindex='-1']),
    select:not([disabled]):not([tabindex='-1']),
    textarea:not([disabled]):not([tabindex='-1']),
    button:not([disabled]):not([tabindex='-1']),
    iframe:not([tabindex='-1']),
    [tabindex]:not([tabindex='-1']),
    [contentEditable=true]:not([tabindex='-1']),
    details > summary:not([tabindex='-1'])
  `.trim().replace(/\s+/g, ' ');

  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  restoreFocus(): void {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus) {
      try {
        elementToFocus.focus();
      } catch (error) {
        console.warn('Could not restore focus:', error);
      }
    }
  }

  trapFocus(container: HTMLElement, options: FocusTrappingOptions = {}): void {
    this.saveFocus();
    this.focusTrappingEnabled = true;
    this.currentTrapContainer = container;

    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      console.warn('No focusable elements found in focus trap container');
      return;
    }

    this.firstFocusableElement = focusableElements[0];
    this.lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    const initialFocusElement = options.initialFocus 
      ? typeof options.initialFocus === 'string' 
        ? container.querySelector(options.initialFocus) as HTMLElement
        : options.initialFocus
      : this.firstFocusableElement;

    if (initialFocusElement) {
      setTimeout(() => {
        initialFocusElement.focus({ preventScroll: options.preventScroll });
      }, 0);
    }

    // Add event listeners for focus trapping
    document.addEventListener('keydown', this.handleFocusTrap);
    document.addEventListener('focusin', this.handleFocusIn);

    // Store escape key action
    if (options.escapeKeyAction) {
      (container as any)._escapeKeyAction = options.escapeKeyAction;
    }
  }

  releaseFocusTrap(): void {
    this.focusTrappingEnabled = false;
    this.currentTrapContainer = undefined;
    this.firstFocusableElement = undefined;
    this.lastFocusableElement = undefined;

    document.removeEventListener('keydown', this.handleFocusTrap);
    document.removeEventListener('focusin', this.handleFocusIn);

    this.restoreFocus();
  }

  private handleFocusTrap = (event: KeyboardEvent): void => {
    if (!this.focusTrappingEnabled || !this.currentTrapContainer) return;

    if (event.key === 'Escape') {
      const escapeAction = (this.currentTrapContainer as any)._escapeKeyAction;
      if (escapeAction) {
        escapeAction();
      }
      return;
    }

    if (event.key === 'Tab') {
      const isShiftPressed = event.shiftKey;
      
      if (isShiftPressed) {
        if (document.activeElement === this.firstFocusableElement) {
          event.preventDefault();
          this.lastFocusableElement?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusableElement) {
          event.preventDefault();
          this.firstFocusableElement?.focus();
        }
      }
    }
  };

  private handleFocusIn = (event: FocusEvent): void => {
    if (!this.focusTrappingEnabled || !this.currentTrapContainer) return;

    const target = event.target as HTMLElement;
    
    if (!this.currentTrapContainer.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      this.firstFocusableElement?.focus();
    }
  };

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(container.querySelectorAll(this.focusableSelector)) as HTMLElement[];
    
    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('disabled') &&
        element.tabIndex !== -1
      );
    });
  }

  // Set focus with optional visual focus indicator enhancement
  setFocus(element: HTMLElement, options: { preventScroll?: boolean; enhanceVisualFocus?: boolean } = {}): void {
    try {
      element.focus({ preventScroll: options.preventScroll });
      
      if (options.enhanceVisualFocus) {
        this.enhanceVisualFocus(element);
      }
    } catch (error) {
      console.warn('Could not set focus:', error);
    }
  }

  private enhanceVisualFocus(element: HTMLElement): void {
    // Add temporary enhanced focus styling
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;
    
    element.style.outline = '3px solid var(--color-gold-500, #D4AF37)';
    element.style.outlineOffset = '2px';

    // Remove enhancement after a short time
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.outlineOffset = originalOutlineOffset;
    }, 2000);
  }
}

export class AccessibilityValidator {
  // Validate color contrast ratios
  static checkColorContrast(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      // Convert hex color to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const sRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      
      return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Check if element has proper ARIA labels
  static hasAccessibleName(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      (element as HTMLInputElement).placeholder ||
      element.getAttribute('title') ||
      (element.tagName === 'IMG' && (element as HTMLImageElement).alt) ||
      (element.tagName === 'INPUT' && this.getLabelForInput(element as HTMLInputElement))
    );
  }

  private static getLabelForInput(input: HTMLInputElement): string | null {
    // Check for associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label?.textContent?.trim()) {
        return label.textContent.trim();
      }
    }

    // Check for wrapping label
    const wrappingLabel = input.closest('label');
    if (wrappingLabel?.textContent?.trim()) {
      return wrappingLabel.textContent.trim();
    }

    return null;
  }

  // Check if element is keyboard accessible
  static isKeyboardAccessible(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
    
    if (interactiveTags.includes(tagName)) {
      return element.tabIndex !== -1 && !element.hasAttribute('disabled');
    }

    // Check if element has role that requires keyboard access
    const role = element.getAttribute('role');
    const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'tab'];
    
    if (role && interactiveRoles.includes(role)) {
      return element.tabIndex >= 0;
    }

    return false;
  }

  // Audit entire document for accessibility issues
  static auditDocument(): AccessibilityMetrics {
    const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    const interactiveElements = allElements.filter(el => this.isInteractiveElement(el));
    
    let missingLabels = 0;
    let insufficientContrast = 0;
    let keyboardInaccessible = 0;

    interactiveElements.forEach(element => {
      if (!this.hasAccessibleName(element)) {
        missingLabels++;
      }

      if (!this.isKeyboardAccessible(element)) {
        keyboardInaccessible++;
      }

      // Check color contrast (simplified check for text elements)
      const styles = window.getComputedStyle(element);
      const textColor = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (textColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        try {
          const contrast = this.checkColorContrast(
            this.rgbToHex(textColor),
            this.rgbToHex(backgroundColor)
          );
          
          if (contrast < 4.5) {
            insufficientContrast++;
          }
        } catch {
          // Skip color contrast check if colors can't be parsed
        }
      }
    });

    const accessibleElements = interactiveElements.length - missingLabels - keyboardInaccessible;
    const complianceScore = Math.round((accessibleElements / Math.max(interactiveElements.length, 1)) * 100);

    return {
      totalElements: allElements.length,
      accessibleElements,
      missingLabels,
      insufficientContrast,
      keyboardInaccessible,
      complianceScore
    };
  }

  private static isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'tab'];
    
    return (
      interactiveTags.includes(element.tagName.toLowerCase()) ||
      (element.getAttribute('role') && interactiveRoles.includes(element.getAttribute('role')!)) ||
      element.tabIndex >= 0
    );
  }

  private static rgbToHex(rgb: string): string {
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) throw new Error('Invalid RGB color');
    
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  }
}

export class AccessibilityManager {
  private liveRegionManager: LiveRegionManager;
  private focusManager: FocusManager;
  private options: Required<AccessibilityOptions>;
  private initialized = false;

  constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announceDelays: { polite: 100, assertive: 0 },
      keyboardNavigation: true,
      focusManagement: true,
      screenReaderOptimization: true,
      highContrastSupport: true,
      ...options
    };

    this.focusManager = new FocusManager();
    this.liveRegionManager = new LiveRegionManager(this.options);
    
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    // Add skip links if not present
    this.addSkipLinks();

    // Initialize keyboard navigation
    if (this.options.keyboardNavigation) {
      this.initializeKeyboardNavigation();
    }

    // Initialize high contrast support
    if (this.options.highContrastSupport) {
      this.initializeHighContrastSupport();
    }

    // Add global keyboard event handlers
    document.addEventListener('keydown', this.handleGlobalKeydown);

    this.initialized = true;
  }

  private addSkipLinks(): void {
    if (document.querySelector('.skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary-500, #8B1538);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.2s ease;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private initializeKeyboardNavigation(): void {
    // Add visual focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .enhanced-focus {
        outline: 3px solid var(--color-gold-500, #D4AF37) !important;
        outline-offset: 2px !important;
      }
      
      /* Ensure focus is visible on all interactive elements */
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      [role="button"]:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid var(--color-gold-500, #D4AF37) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  private initializeHighContrastSupport(): void {
    // Detect high contrast mode
    const highContrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const applyHighContrast = (matches: boolean) => {
      document.documentElement.classList.toggle('high-contrast', matches);
    };

    applyHighContrast(highContrastMediaQuery.matches);
    highContrastMediaQuery.addEventListener('change', (e) => applyHighContrast(e.matches));
  }

  private handleGlobalKeydown = (event: KeyboardEvent): void => {
    // Handle Escape key globally
    if (event.key === 'Escape') {
      const activeModal = document.querySelector('.modal.open, .modal[aria-hidden="false"]');
      if (activeModal) {
        const closeButton = activeModal.querySelector('.modal-close, [data-modal-close]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }

    // Handle Alt+1 for main content (alternative skip link)
    if (event.altKey && event.key === '1') {
      event.preventDefault();
      const main = document.querySelector('#main, main, [role="main"]') as HTMLElement;
      if (main) {
        this.focusManager.setFocus(main, { enhanceVisualFocus: true });
      }
    }
  };

  // Public API methods
  announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.liveRegionManager.announce(text, priority);
  }

  trapFocus(container: HTMLElement, options: FocusTrappingOptions = {}): void {
    this.focusManager.trapFocus(container, options);
  }

  releaseFocusTrap(): void {
    this.focusManager.releaseFocusTrap();
  }

  setFocus(element: HTMLElement, options: { preventScroll?: boolean; enhanceVisualFocus?: boolean } = {}): void {
    this.focusManager.setFocus(element, options);
  }

  saveFocus(): void {
    this.focusManager.saveFocus();
  }

  restoreFocus(): void {
    this.focusManager.restoreFocus();
  }

  // Get accessibility metrics for monitoring
  getAccessibilityMetrics(): AccessibilityMetrics {
    return AccessibilityValidator.auditDocument();
  }

  // Validate specific element accessibility
  validateElement(element: HTMLElement): {
    hasAccessibleName: boolean;
    isKeyboardAccessible: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const hasAccessibleName = AccessibilityValidator.hasAccessibleName(element);
    const isKeyboardAccessible = AccessibilityValidator.isKeyboardAccessible(element);

    if (!hasAccessibleName) {
      issues.push('Missing accessible name (aria-label, aria-labelledby, or visible text)');
    }

    if (!isKeyboardAccessible) {
      issues.push('Not keyboard accessible (missing tabindex or disabled)');
    }

    return {
      hasAccessibleName,
      isKeyboardAccessible,
      issues
    };
  }

  // Cleanup method
  destroy(): void {
    this.liveRegionManager.clear();
    this.focusManager.releaseFocusTrap();
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    this.initialized = false;
  }
}

// Global accessibility manager instance
let globalAccessibilityManager: AccessibilityManager;

export function getAccessibilityManager(): AccessibilityManager {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityManager();
  }
  return globalAccessibilityManager;
}

// Initialize accessibility manager and make it globally available
if (typeof window !== 'undefined') {
  (window as any).accessibilityManager = getAccessibilityManager();
}