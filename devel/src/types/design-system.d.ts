// Type definitions for Design System Phase 1 Foundation
// Ensures type safety for design tokens, animations, and accessibility

declare global {
  interface Window {
    animationEngine?: import('../design-system/animations/AnimationEngine').AnimationEngine;
    accessibilityManager?: import('../infrastructure/accessibility/AccessibilityManager').AccessibilityManager;
    designTokens?: import('../design-system/tokens/index').DesignTokens;
    CSSTokenGenerator?: typeof import('../design-system/tokens/index').CSSTokenGenerator;
  }
}

// Design System Token Types
export interface DesignSystemConfig {
  enableAnimations: boolean;
  enableAccessibility: boolean;
  enablePerformanceMonitoring: boolean;
  enableDesignTokens: boolean;
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
}

// Animation System Types
export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  respectMotionPreferences?: boolean;
}

export interface AnimationPerformanceConfig {
  targetFPS: number;
  maxDroppedFrames: number;
  memoryLimit: number; // in MB
  enableHardwareAcceleration: boolean;
}

// Accessibility Types
export interface AccessibilityConfig {
  enableScreenReaderSupport: boolean;
  enableKeyboardNavigation: boolean;
  enableFocusManagement: boolean;
  enableColorContrastValidation: boolean;
  announceDelays: {
    polite: number;
    assertive: number;
  };
  minimumTouchTargetSize: number;
}

export interface WCAGComplianceLevel {
  level: 'A' | 'AA' | 'AAA';
  colorContrastRatio: number;
  minimumFontSize: number;
  requiresKeyboardAccess: boolean;
}

// Component Enhancement Types
export interface ComponentEnhancementOptions {
  enableAnimations: boolean;
  enableAccessibility: boolean;
  enablePerformanceOptimizations: boolean;
  enableResponsiveDesign: boolean;
  enableDarkMode: boolean;
  enableHighContrast: boolean;
}

// Progressive Disclosure Types
export interface DisclosureState {
  expanded: boolean;
  animating: boolean;
  height: number;
  canToggle: boolean;
}

export interface DisclosureOptions {
  initiallyExpanded?: boolean;
  animationDuration?: number;
  animationEasing?: string;
  enableKeyboardControl?: boolean;
  announceStateChanges?: boolean;
}

// Performance Monitoring Types
export interface PerformanceThresholds {
  loadTime: number;      // Maximum acceptable load time in ms
  renderTime: number;    // Maximum acceptable render time in ms
  memoryUsage: number;   // Maximum acceptable memory usage in MB
  fps: number;           // Minimum acceptable FPS
}

export interface PerformanceBudget {
  initialLoad: PerformanceThresholds;
  runtime: PerformanceThresholds;
  animations: {
    maxConcurrent: number;
    targetFPS: number;
    maxDuration: number;
  };
}

// Format Selection Types
export interface FormatSelectionState {
  selectedFormat: string;
  availableFormats: string[];
  compatibilityScores: Record<string, number>;
  warnings: Record<string, string[]>;
  estimatedOutputSizes: Record<string, string>;
}

// Character Preview Enhancement Types
export interface CharacterPreviewState {
  character: any;
  expandedSections: Set<string>;
  validationStatus: ValidationStatus | null;
  performanceMetrics: ComponentPerformanceMetrics;
  renderingMode: 'full' | 'summary' | 'minimal';
}

export interface ValidationStatus {
  completeness: number;          // 0-100%
  warnings: ValidationWarning[];
  criticalIssues: ValidationIssue[];
  performanceScore: number;      // 0-100
}

export interface ValidationWarning {
  type: string;
  message: string;
  field: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationIssue {
  type: string;
  message: string;
  field: string;
  blocking: boolean;
}

export interface ComponentPerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  complexity: 'low' | 'medium' | 'high';
  optimizationsApplied: string[];
}

// Design System Integration Types
export interface DesignSystemIntegration {
  tokensLoaded: boolean;
  animationEngineReady: boolean;
  accessibilityManagerReady: boolean;
  performanceMonitoringActive: boolean;
  tailwindConfigUpdated: boolean;
}

// Utility Types for Design System
export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type TypographyScale = {
  fontSize: string;
  lineHeight: string | number;
  letterSpacing?: string;
  fontWeight?: number;
};

export type SpacingScale = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
};

export type AnimationEasing = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out' 
  | 'ease-in-out'
  | 'spring-gentle'
  | 'spring-bouncy'
  | 'spring-firm'
  | string; // For custom cubic-bezier curves

export type MediaQuery = 
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'wide'
  | 'prefers-reduced-motion'
  | 'prefers-color-scheme-dark'
  | 'prefers-contrast-high';

// Export everything as module types
export {};