// Performance-Optimized Animation Engine
// Provides hardware-accelerated animations with 60fps performance targets

export interface AnimationPerformanceMetrics {
  activeAnimations: number;
  droppedFrames: number;
  averageFPS: number;
  memoryUsage: number;
}

export interface ProgressAnimationOptions {
  duration?: number;
  easing?: string;
  shimmer?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export class AnimationController {
  constructor(
    public readonly id: string,
    public readonly animation: Animation
  ) {}

  play(): void {
    this.animation.play();
  }

  pause(): void {
    this.animation.pause();
  }

  cancel(): void {
    this.animation.cancel();
  }

  finish(): void {
    this.animation.finish();
  }

  get finished(): Promise<Animation> {
    return this.animation.finished;
  }

  get playState(): AnimationPlayState {
    return this.animation.playState;
  }
}

export class CompositeAnimationController {
  constructor(private animations: Animation[]) {}

  async playAll(): Promise<void> {
    const promises = this.animations.map(anim => {
      anim.play();
      return anim.finished;
    });

    await Promise.all(promises);
  }

  pauseAll(): void {
    this.animations.forEach(anim => anim.pause());
  }

  cancelAll(): void {
    this.animations.forEach(anim => anim.cancel());
  }

  finishAll(): void {
    this.animations.forEach(anim => anim.finish());
  }
}

export class ProgressAnimationController {
  private element: HTMLElement;
  private progressBar: HTMLElement;
  private shimmerElement?: HTMLElement;
  private currentAnimation?: Animation;
  private options: Required<ProgressAnimationOptions>;

  constructor(element: HTMLElement, options: ProgressAnimationOptions = {}) {
    this.element = element;
    this.options = {
      duration: 600,
      easing: 'var(--easing-easeOut, ease-out)',
      shimmer: true,
      onProgress: () => {},
      onComplete: () => {},
      ...options
    };

    this.initializeProgressBar();
    if (this.options.shimmer) {
      this.createShimmerEffect();
    }
  }

  private initializeProgressBar(): void {
    this.progressBar = this.element.querySelector('.progress-bar') as HTMLElement;
    if (!this.progressBar) {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'progress-bar';
      this.element.appendChild(this.progressBar);
    }

    // Set initial styles
    this.progressBar.style.width = '0%';
    this.progressBar.style.height = '100%';
    this.progressBar.style.background = 'var(--color-primary-500, #8B1538)';
    this.progressBar.style.borderRadius = 'inherit';
    this.progressBar.style.transformOrigin = 'left center';
    this.progressBar.style.willChange = 'width, transform';
  }

  private createShimmerEffect(): void {
    this.shimmerElement = document.createElement('div');
    this.shimmerElement.className = 'progress-shimmer';
    
    // Shimmer styles
    this.shimmerElement.style.position = 'absolute';
    this.shimmerElement.style.top = '0';
    this.shimmerElement.style.left = '-100%';
    this.shimmerElement.style.width = '100%';
    this.shimmerElement.style.height = '100%';
    this.shimmerElement.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)';
    this.shimmerElement.style.willChange = 'transform';

    this.progressBar.style.position = 'relative';
    this.progressBar.style.overflow = 'hidden';
    this.progressBar.appendChild(this.shimmerElement);
  }

  animateToProgress(targetProgress: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentAnimation) {
        this.currentAnimation.cancel();
      }

      const startProgress = parseFloat(this.progressBar.style.width) || 0;
      const progressDiff = targetProgress - startProgress;

      // Create main progress animation
      this.currentAnimation = this.progressBar.animate([
        { width: `${startProgress}%` },
        { width: `${targetProgress}%` }
      ], {
        duration: this.options.duration,
        easing: this.options.easing,
        fill: 'forwards'
      });

      // Animate shimmer effect
      if (this.shimmerElement) {
        this.shimmerElement.animate([
          { transform: 'translateX(-100%)' },
          { transform: 'translateX(400%)' }
        ], {
          duration: this.options.duration * 1.5,
          easing: this.options.easing,
          iterations: 1
        });
      }

      // Track progress and call callback
      let animationProgress = 0;
      const progressInterval = setInterval(() => {
        animationProgress += 16.67; // ~60fps
        const currentProgress = startProgress + (progressDiff * (animationProgress / this.options.duration));
        this.options.onProgress(Math.min(currentProgress, targetProgress));

        if (animationProgress >= this.options.duration) {
          clearInterval(progressInterval);
        }
      }, 16);

      this.currentAnimation.addEventListener('finish', () => {
        clearInterval(progressInterval);
        this.options.onComplete();
        resolve();
      });
    });
  }

  reset(): void {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
    }
    this.progressBar.style.width = '0%';
  }
}

export class AnimationEngine {
  private static instance: AnimationEngine;
  private runningAnimations = new Map<string, AnimationController>();
  private performanceMetrics: AnimationPerformanceMetrics;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];

  private constructor() {
    this.performanceMetrics = {
      activeAnimations: 0,
      droppedFrames: 0,
      averageFPS: 60,
      memoryUsage: 0
    };

    this.startPerformanceMonitoring();
  }

  static getInstance(): AnimationEngine {
    if (!AnimationEngine.instance) {
      AnimationEngine.instance = new AnimationEngine();
    }
    return AnimationEngine.instance;
  }

  private startPerformanceMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        this.performanceMetrics.averageFPS = 
          this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;

        if (fps < 55) {
          this.performanceMetrics.droppedFrames++;
        }
      }

      this.lastFrameTime = timestamp;
      this.frameCount++;

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  // Hardware-accelerated button hover animation
  createButtonHover(element: HTMLElement): AnimationController {
    const animationId = `button-hover-${Date.now()}-${Math.random()}`;
    
    // Ensure hardware acceleration
    element.style.willChange = 'transform, box-shadow';
    
    const animation = element.animate([
      {
        transform: 'translateY(0px)',
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(139, 21, 56, 0.2))'
      },
      {
        transform: 'translateY(-2px)',
        boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(139, 21, 56, 0.1))'
      }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local').replace('ms', '')) || 250,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-easeOut') || 'cubic-bezier(0.0, 0, 0.2, 1)',
      fill: 'both'
    });
    
    const controller = new AnimationController(animationId, animation);
    this.runningAnimations.set(animationId, controller);
    
    // Cleanup when animation completes
    animation.addEventListener('finish', () => {
      this.runningAnimations.delete(animationId);
      element.style.willChange = 'auto';
    });
    
    animation.addEventListener('cancel', () => {
      this.runningAnimations.delete(animationId);
      element.style.willChange = 'auto';
    });
    
    return controller;
  }

  // Reverse button hover animation
  createButtonHoverReverse(element: HTMLElement): AnimationController {
    const animationId = `button-hover-reverse-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'transform, box-shadow';
    
    const animation = element.animate([
      {
        transform: 'translateY(-2px)',
        boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(139, 21, 56, 0.1))'
      },
      {
        transform: 'translateY(0px)',
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(139, 21, 56, 0.2))'
      }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local').replace('ms', '')) || 250,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-easeInOut') || 'cubic-bezier(0.4, 0, 0.6, 1)',
      fill: 'both'
    });
    
    const controller = new AnimationController(animationId, animation);
    this.runningAnimations.set(animationId, controller);
    
    animation.addEventListener('finish', () => {
      this.runningAnimations.delete(animationId);
      element.style.willChange = 'auto';
    });
    
    return controller;
  }

  // Complex progress animation with shimmer effect
  createProgressAnimation(
    element: HTMLElement, 
    options: ProgressAnimationOptions = {}
  ): ProgressAnimationController {
    return new ProgressAnimationController(element, options);
  }

  // Modal entrance animation with backdrop blur
  createModalEntrance(modal: HTMLElement): CompositeAnimationController {
    const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
    const content = modal.querySelector('.modal-content') as HTMLElement;
    
    if (!backdrop || !content) {
      throw new Error('Modal must contain .modal-backdrop and .modal-content elements');
    }

    // Set up hardware acceleration
    backdrop.style.willChange = 'opacity, backdrop-filter';
    content.style.willChange = 'transform, opacity';
    
    // Backdrop animation
    const backdropAnimation = backdrop.animate([
      { opacity: '0', backdropFilter: 'blur(0px)' },
      { opacity: '1', backdropFilter: 'blur(4px)' }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-page').replace('ms', '')) || 350,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-easeOut') || 'cubic-bezier(0.0, 0, 0.2, 1)',
      fill: 'forwards'
    });
    
    // Content animation with spring effect
    const contentAnimation = content.animate([
      { 
        opacity: '0', 
        transform: 'scale(0.95) translateY(-20px)'
      },
      { 
        opacity: '1', 
        transform: 'scale(1) translateY(0px)'
      }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-page').replace('ms', '')) || 350,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-spring-gentle') || 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    // Cleanup hardware acceleration hints
    const cleanup = () => {
      backdrop.style.willChange = 'auto';
      content.style.willChange = 'auto';
    };

    Promise.all([backdropAnimation.finished, contentAnimation.finished])
      .then(cleanup)
      .catch(cleanup);
    
    return new CompositeAnimationController([backdropAnimation, contentAnimation]);
  }

  // Modal exit animation
  createModalExit(modal: HTMLElement): CompositeAnimationController {
    const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
    const content = modal.querySelector('.modal-content') as HTMLElement;
    
    if (!backdrop || !content) {
      throw new Error('Modal must contain .modal-backdrop and .modal-content elements');
    }

    backdrop.style.willChange = 'opacity, backdrop-filter';
    content.style.willChange = 'transform, opacity';
    
    // Content exit animation
    const contentAnimation = content.animate([
      { 
        opacity: '1', 
        transform: 'scale(1) translateY(0px)'
      },
      { 
        opacity: '0', 
        transform: 'scale(0.95) translateY(-10px)'
      }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local').replace('ms', '')) || 250,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-sharp') || 'cubic-bezier(0.4, 0, 0.6, 1)',
      fill: 'forwards'
    });
    
    // Backdrop exit animation (slightly delayed)
    const backdropAnimation = backdrop.animate([
      { opacity: '1', backdropFilter: 'blur(4px)' },
      { opacity: '0', backdropFilter: 'blur(0px)' }
    ], {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local').replace('ms', '')) || 250,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-sharp') || 'cubic-bezier(0.4, 0, 0.6, 1)',
      delay: 50,
      fill: 'forwards'
    });

    const cleanup = () => {
      backdrop.style.willChange = 'auto';
      content.style.willChange = 'auto';
    };

    Promise.all([backdropAnimation.finished, contentAnimation.finished])
      .then(cleanup)
      .catch(cleanup);
    
    return new CompositeAnimationController([contentAnimation, backdropAnimation]);
  }

  // Card hover animation with scale and shadow
  createCardHover(element: HTMLElement, isEntering = true): AnimationController {
    const animationId = `card-hover-${Date.now()}-${Math.random()}`;
    
    element.style.willChange = 'transform, box-shadow';
    
    const keyframes = isEntering 
      ? [
          { 
            transform: 'translateY(0px) scale(1)', 
            boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.05))' 
          },
          { 
            transform: 'translateY(-4px) scale(1.02)', 
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(139, 21, 56, 0.1))' 
          }
        ]
      : [
          { 
            transform: 'translateY(-4px) scale(1.02)', 
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(139, 21, 56, 0.1))' 
          },
          { 
            transform: 'translateY(0px) scale(1)', 
            boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.05))' 
          }
        ];
    
    const animation = element.animate(keyframes, {
      duration: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--duration-local').replace('ms', '')) || 250,
      easing: getComputedStyle(document.documentElement)
        .getPropertyValue('--easing-easeOut') || 'cubic-bezier(0.0, 0, 0.2, 1)',
      fill: 'both'
    });
    
    const controller = new AnimationController(animationId, animation);
    this.runningAnimations.set(animationId, controller);
    
    animation.addEventListener('finish', () => {
      this.runningAnimations.delete(animationId);
      element.style.willChange = 'auto';
    });
    
    return controller;
  }

  // Check if animations should be enabled (respects user preferences)
  shouldAnimate(): boolean {
    try {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      // Fallback if matchMedia is not supported
      return true;
    }
  }

  // Get current performance metrics
  getPerformanceMetrics(): AnimationPerformanceMetrics {
    this.performanceMetrics.activeAnimations = this.runningAnimations.size;
    
    // Estimate memory usage (rough calculation)
    this.performanceMetrics.memoryUsage = this.runningAnimations.size * 1024; // ~1KB per animation

    return { ...this.performanceMetrics };
  }

  // Cancel all running animations
  cancelAllAnimations(): void {
    this.runningAnimations.forEach(controller => {
      controller.cancel();
    });
    this.runningAnimations.clear();
  }

  // Pause all running animations
  pauseAllAnimations(): void {
    this.runningAnimations.forEach(controller => {
      controller.pause();
    });
  }

  // Resume all paused animations
  resumeAllAnimations(): void {
    this.runningAnimations.forEach(controller => {
      controller.play();
    });
  }
}

// Global animation engine instance
let globalAnimationEngine: AnimationEngine;

export function getAnimationEngine(): AnimationEngine {
  if (!globalAnimationEngine) {
    globalAnimationEngine = AnimationEngine.getInstance();
  }
  return globalAnimationEngine;
}

// Initialize animation engine and make it globally available
if (typeof window !== 'undefined') {
  (window as any).animationEngine = getAnimationEngine();
}