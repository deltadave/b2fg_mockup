// Disclosure-Specific Animation System
// High-performance animations optimized for progressive disclosure components

import { getAnimationEngine, AnimationController } from './AnimationEngine';

export interface DisclosureAnimationOptions {
  duration?: number;
  easing?: string;
  enableChevronRotation?: boolean;
  enableContentFade?: boolean;
  enableHeightAnimation?: boolean;
  reducedMotion?: boolean;
}

export interface DisclosureElements {
  trigger: HTMLElement;
  content: HTMLElement;
  chevron?: HTMLElement;
}

export class DisclosureAnimationController {
  private animationEngine = getAnimationEngine();
  private activeAnimations = new Map<string, AnimationController[]>();
  
  constructor(private options: Required<DisclosureAnimationOptions>) {}

  // Create optimized expand animation
  async animateExpand(
    elements: DisclosureElements, 
    sectionId: string
  ): Promise<void> {
    // Cancel any existing animations for this section
    this.cancelSectionAnimations(sectionId);

    // Check if animations should be disabled
    if (this.options.reducedMotion || !this.animationEngine.shouldAnimate()) {
      this.showContentImmediately(elements.content);
      this.rotateChevronImmediately(elements.chevron, true);
      return;
    }

    const animations: AnimationController[] = [];

    // Prepare content element for animation
    this.prepareContentForExpansion(elements.content);
    
    // Get natural height for smooth animation
    const targetHeight = elements.content.scrollHeight;

    // 1. Height expansion animation
    if (this.options.enableHeightAnimation) {
      const heightController = this.createHeightExpansionAnimation(
        elements.content, 
        targetHeight
      );
      animations.push(heightController);
    }

    // 2. Content fade-in animation
    if (this.options.enableContentFade) {
      const fadeController = this.createContentFadeInAnimation(elements.content);
      animations.push(fadeController);
    }

    // 3. Chevron rotation animation
    if (this.options.enableChevronRotation && elements.chevron) {
      const chevronController = this.createChevronRotationAnimation(
        elements.chevron, 
        0, 
        90
      );
      animations.push(chevronController);
    }

    // Store animations for cleanup
    this.activeAnimations.set(sectionId, animations);

    // Start all animations
    const promises = animations.map(controller => {
      controller.play();
      return controller.finished;
    });

    try {
      await Promise.all(promises);
      this.finalizeExpansion(elements.content);
    } catch (error) {
      console.warn('Disclosure expand animation interrupted:', error);
      this.showContentImmediately(elements.content);
    } finally {
      this.activeAnimations.delete(sectionId);
    }
  }

  // Create optimized collapse animation
  async animateCollapse(
    elements: DisclosureElements, 
    sectionId: string
  ): Promise<void> {
    // Cancel any existing animations for this section
    this.cancelSectionAnimations(sectionId);

    // Check if animations should be disabled
    if (this.options.reducedMotion || !this.animationEngine.shouldAnimate()) {
      this.hideContentImmediately(elements.content);
      this.rotateChevronImmediately(elements.chevron, false);
      return;
    }

    const animations: AnimationController[] = [];

    // Prepare content element for collapse
    this.prepareContentForCollapse(elements.content);

    // 1. Content fade-out animation (start first for smooth transition)
    if (this.options.enableContentFade) {
      const fadeController = this.createContentFadeOutAnimation(elements.content);
      animations.push(fadeController);
    }

    // 2. Height collapse animation (slightly delayed for smooth effect)
    if (this.options.enableHeightAnimation) {
      const heightController = this.createHeightCollapseAnimation(
        elements.content,
        50 // Small delay after fade starts
      );
      animations.push(heightController);
    }

    // 3. Chevron rotation animation
    if (this.options.enableChevronRotation && elements.chevron) {
      const chevronController = this.createChevronRotationAnimation(
        elements.chevron, 
        90, 
        0
      );
      animations.push(chevronController);
    }

    // Store animations for cleanup
    this.activeAnimations.set(sectionId, animations);

    // Start all animations
    const promises = animations.map(controller => {
      controller.play();
      return controller.finished;
    });

    try {
      await Promise.all(promises);
      this.finalizeCollapse(elements.content);
    } catch (error) {
      console.warn('Disclosure collapse animation interrupted:', error);
      this.hideContentImmediately(elements.content);
    } finally {
      this.activeAnimations.delete(sectionId);
    }
  }

  // Create height expansion animation controller
  private createHeightExpansionAnimation(
    element: HTMLElement, 
    targetHeight: number
  ): AnimationController {
    const animationId = `height-expand-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'height';
    
    const animation = element.animate([
      { 
        height: '0px',
        paddingTop: '0px',
        paddingBottom: '0px'
      },
      { 
        height: `${targetHeight}px`,
        paddingTop: '',
        paddingBottom: ''
      }
    ], {
      duration: this.options.duration,
      easing: this.options.easing,
      fill: 'forwards'
    });

    return new AnimationController(animationId, animation);
  }

  // Create height collapse animation controller
  private createHeightCollapseAnimation(
    element: HTMLElement,
    delay = 0
  ): AnimationController {
    const animationId = `height-collapse-${Date.now()}-${Math.random()}`;
    const currentHeight = element.scrollHeight;
    
    element.style.willChange = 'height';
    
    const animation = element.animate([
      { 
        height: `${currentHeight}px`,
        paddingTop: '',
        paddingBottom: ''
      },
      { 
        height: '0px',
        paddingTop: '0px',
        paddingBottom: '0px'
      }
    ], {
      duration: this.options.duration,
      easing: this.options.easing,
      delay,
      fill: 'forwards'
    });

    return new AnimationController(animationId, animation);
  }

  // Create content fade-in animation controller
  private createContentFadeInAnimation(element: HTMLElement): AnimationController {
    const animationId = `fade-in-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'opacity, transform';
    
    const animation = element.animate([
      { 
        opacity: '0',
        transform: 'translateY(-8px) scale(0.98)'
      },
      { 
        opacity: '1',
        transform: 'translateY(0px) scale(1)'
      }
    ], {
      duration: this.options.duration,
      easing: this.options.easing,
      delay: 100, // Slight delay for smooth effect
      fill: 'forwards'
    });

    return new AnimationController(animationId, animation);
  }

  // Create content fade-out animation controller
  private createContentFadeOutAnimation(element: HTMLElement): AnimationController {
    const animationId = `fade-out-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'opacity, transform';
    
    const animation = element.animate([
      { 
        opacity: '1',
        transform: 'translateY(0px) scale(1)'
      },
      { 
        opacity: '0',
        transform: 'translateY(-4px) scale(0.99)'
      }
    ], {
      duration: Math.round(this.options.duration * 0.7), // Faster fade-out
      easing: this.options.easing,
      fill: 'forwards'
    });

    return new AnimationController(animationId, animation);
  }

  // Create chevron rotation animation controller
  private createChevronRotationAnimation(
    element: HTMLElement,
    fromAngle: number,
    toAngle: number
  ): AnimationController {
    const animationId = `chevron-rotate-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'transform';
    element.style.transformOrigin = 'center center';
    
    const animation = element.animate([
      { transform: `rotate(${fromAngle}deg)` },
      { transform: `rotate(${toAngle}deg)` }
    ], {
      duration: Math.round(this.options.duration * 0.8), // Slightly faster rotation
      easing: this.options.easing,
      fill: 'forwards'
    });

    return new AnimationController(animationId, animation);
  }

  // Preparation methods
  private prepareContentForExpansion(element: HTMLElement): void {
    element.style.display = 'block';
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.opacity = '0';
  }

  private prepareContentForCollapse(element: HTMLElement): void {
    const currentHeight = element.scrollHeight;
    element.style.height = `${currentHeight}px`;
    element.style.overflow = 'hidden';
  }

  // Finalization methods
  private finalizeExpansion(element: HTMLElement): void {
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.opacity = '1';
    element.style.willChange = 'auto';
  }

  private finalizeCollapse(element: HTMLElement): void {
    element.style.display = 'none';
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.opacity = '1';
    element.style.willChange = 'auto';
  }

  // Immediate fallback methods (for reduced motion)
  private showContentImmediately(element: HTMLElement): void {
    element.style.display = 'block';
    element.style.height = 'auto';
    element.style.opacity = '1';
    element.style.overflow = 'visible';
    element.style.willChange = 'auto';
  }

  private hideContentImmediately(element: HTMLElement): void {
    element.style.display = 'none';
    element.style.height = 'auto';
    element.style.opacity = '1';
    element.style.overflow = 'visible';
    element.style.willChange = 'auto';
  }

  private rotateChevronImmediately(element: HTMLElement | undefined, expanded: boolean): void {
    if (!element) return;
    
    element.style.transform = `rotate(${expanded ? 90 : 0}deg)`;
    element.style.willChange = 'auto';
  }

  // Utility methods
  private cancelSectionAnimations(sectionId: string): void {
    const animations = this.activeAnimations.get(sectionId);
    if (animations) {
      animations.forEach(controller => controller.cancel());
      this.activeAnimations.delete(sectionId);
    }
  }

  // Cancel all active disclosure animations
  cancelAllAnimations(): void {
    this.activeAnimations.forEach((animations, sectionId) => {
      animations.forEach(controller => controller.cancel());
    });
    this.activeAnimations.clear();
  }

  // Get performance metrics for disclosure animations
  getPerformanceMetrics(): {
    activeAnimations: number;
    activeSections: number;
  } {
    let totalAnimations = 0;
    this.activeAnimations.forEach(animations => {
      totalAnimations += animations.length;
    });

    return {
      activeAnimations: totalAnimations,
      activeSections: this.activeAnimations.size
    };
  }
}

// Factory function for creating disclosure animation controllers
export function createDisclosureAnimationController(
  options: DisclosureAnimationOptions = {}
): DisclosureAnimationController {
  const defaultOptions: Required<DisclosureAnimationOptions> = {
    duration: parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local')
        .replace('ms', '')
    ) || 350,
    easing: getComputedStyle(document.documentElement)
      .getPropertyValue('--easing-spring-gentle') || 'cubic-bezier(0.16, 1, 0.3, 1)',
    enableChevronRotation: true,
    enableContentFade: true,
    enableHeightAnimation: true,
    reducedMotion: !getAnimationEngine().shouldAnimate()
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return new DisclosureAnimationController(mergedOptions);
}

// Simplified animation functions for direct use
export const disclosureAnimations = {
  // Quick expand with default settings
  async quickExpand(
    trigger: HTMLElement, 
    content: HTMLElement, 
    chevron?: HTMLElement
  ): Promise<void> {
    const controller = createDisclosureAnimationController({
      duration: 250,
      enableContentFade: false // Skip fade for quick animation
    });
    
    await controller.animateExpand(
      { trigger, content, chevron }, 
      `quick-${Date.now()}`
    );
  },

  // Quick collapse with default settings
  async quickCollapse(
    trigger: HTMLElement, 
    content: HTMLElement, 
    chevron?: HTMLElement
  ): Promise<void> {
    const controller = createDisclosureAnimationController({
      duration: 200,
      enableContentFade: false // Skip fade for quick animation
    });
    
    await controller.animateCollapse(
      { trigger, content, chevron }, 
      `quick-${Date.now()}`
    );
  },

  // Smooth expand with all effects
  async smoothExpand(
    trigger: HTMLElement, 
    content: HTMLElement, 
    chevron?: HTMLElement
  ): Promise<void> {
    const controller = createDisclosureAnimationController();
    
    await controller.animateExpand(
      { trigger, content, chevron }, 
      `smooth-${Date.now()}`
    );
  },

  // Smooth collapse with all effects
  async smoothCollapse(
    trigger: HTMLElement, 
    content: HTMLElement, 
    chevron?: HTMLElement
  ): Promise<void> {
    const controller = createDisclosureAnimationController();
    
    await controller.animateCollapse(
      { trigger, content, chevron }, 
      `smooth-${Date.now()}`
    );
  }
};

// Global instance for reuse
let globalDisclosureAnimationController: DisclosureAnimationController;

export function getDisclosureAnimationController(): DisclosureAnimationController {
  if (!globalDisclosureAnimationController) {
    globalDisclosureAnimationController = createDisclosureAnimationController();
  }
  return globalDisclosureAnimationController;
}

// Make disclosure animations globally available
if (typeof window !== 'undefined') {
  (window as any).disclosureAnimations = disclosureAnimations;
  (window as any).disclosureAnimationController = getDisclosureAnimationController();
}