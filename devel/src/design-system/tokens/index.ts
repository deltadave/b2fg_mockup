// Design System Tokens - Foundation for consistent styling
// Implements comprehensive design token system with type safety

export interface ColorTokens {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Base primary color #8B1538
    600: string;
    700: string;
    800: string;
    900: string;
  };
  gold: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Base gold color #D4AF37
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Base secondary blue #1E40AF
    600: string;
    700: string;
    800: string;
    900: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  neutral: {
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
  dark: {
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface TypographyTokens {
  fontFamily: {
    primary: string;
    display: string;
    mono: string;
  };
  fontSize: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    bodyLarge: string;
    body: string;
    bodySmall: string;
    caption: string;
    label: string;
    code: string;
    button: string;
  };
  fontWeight: {
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    bodyLarge: number;
    body: number;
    bodySmall: number;
    caption: number;
    label: number;
    code: number;
    button: number;
  };
  letterSpacing: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    label: string;
  };
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface AnimationTokens {
  duration: {
    micro: string;
    local: string;
    page: string;
    complex: string;
  };
  easing: {
    easeOut: string;
    easeInOut: string;
    sharp: string;
    spring: {
      gentle: string;
      bouncy: string;
      firm: string;
    };
  };
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface BorderRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface BreakpointTokens {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  animation: AnimationTokens;
  shadows: ShadowTokens;
  borderRadius: BorderRadiusTokens;
  breakpoints: BreakpointTokens;
}

// Complete design token definitions based on design system specifications
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#FDF2F5',
      100: '#FAE5EB',
      200: '#F2CCD7',
      300: '#E9A8B8',
      400: '#DD7A94',
      500: '#8B1538', // Base primary burgundy
      600: '#6B1028',
      700: '#5A0E23',
      800: '#4A0C1D',
      900: '#3D0A18',
    },
    gold: {
      50: '#FEFBF0',
      100: '#FDF7E1',
      200: '#FAEFC3',
      300: '#F6E7A5',
      400: '#F1DE87',
      500: '#D4AF37', // Base D&D gold
      600: '#B8941F',
      700: '#9C7A18',
      800: '#806010',
      900: '#644609',
    },
    secondary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#1E40AF', // Base fantasy blue
      600: '#1E3A8A',
      700: '#1D4ED8',
      800: '#1E3A8A',
      900: '#1E3A8A',
    },
    semantic: {
      success: '#059669', // Green for success states
      warning: '#D97706', // Orange for warnings
      error: '#DC2626',   // Red for errors
      info: '#0EA5E9',    // Light blue for information
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    dark: {
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    }
  },
  typography: {
    fontFamily: {
      primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      display: `'Cinzel', serif`,
      mono: `'JetBrains Mono', Consolas, 'Courier New', monospace`
    },
    fontSize: {
      h1: '3.5rem',      // 56px
      h2: '2.5rem',      // 40px
      h3: '2rem',        // 32px
      h4: '1.5rem',      // 24px
      h5: '1.25rem',     // 20px
      bodyLarge: '1.125rem', // 18px
      body: '1rem',      // 16px
      bodySmall: '0.875rem', // 14px
      caption: '0.75rem', // 12px
      label: '0.875rem', // 14px
      code: '0.875rem',  // 14px
      button: '1rem'     // 16px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      h1: 1.2,
      h2: 1.3,
      h3: 1.4,
      h4: 1.5,
      h5: 1.6,
      bodyLarge: 1.7,
      body: 1.6,
      bodySmall: 1.5,
      caption: 1.4,
      label: 1.3,
      code: 1.6,
      button: 1.2
    },
    letterSpacing: {
      h1: '-0.025em',
      h2: '-0.02em',
      h3: '-0.015em',
      h4: '-0.01em',
      h5: 'normal',
      label: '0.05em'
    }
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem'   // 64px
  },
  animation: {
    duration: {
      micro: '150ms',
      local: '250ms',
      page: '350ms',
      complex: '600ms'
    },
    easing: {
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      spring: {
        gentle: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        firm: 'cubic-bezier(0.2, 0, 0.38, 0.9)'
      }
    }
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(139, 21, 56, 0.2)',
    lg: '0 8px 24px rgba(139, 21, 56, 0.1)',
    xl: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem'    // 24px
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  }
};

// CSS Custom Properties Generator
export class CSSTokenGenerator {
  static generateCustomProperties(tokens: DesignTokens = designTokens): string {
    const cssVars: string[] = [];

    // Colors
    this.addColorTokens(cssVars, 'primary', tokens.colors.primary);
    this.addColorTokens(cssVars, 'gold', tokens.colors.gold);
    this.addColorTokens(cssVars, 'secondary', tokens.colors.secondary);
    this.addColorTokens(cssVars, 'neutral', tokens.colors.neutral);
    this.addColorTokens(cssVars, 'dark', tokens.colors.dark);
    
    // Semantic colors
    Object.entries(tokens.colors.semantic).forEach(([key, value]) => {
      cssVars.push(`--color-${key}: ${value};`);
    });

    // Typography
    Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
      cssVars.push(`--font-family-${key}: ${value};`);
    });

    Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
      cssVars.push(`--font-size-${key}: ${value};`);
    });

    Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
      cssVars.push(`--font-weight-${key}: ${value};`);
    });

    Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
      cssVars.push(`--line-height-${key}: ${value};`);
    });

    Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
      cssVars.push(`--letter-spacing-${key}: ${value};`);
    });

    // Spacing
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      cssVars.push(`--space-${key}: ${value};`);
    });

    // Animation
    Object.entries(tokens.animation.duration).forEach(([key, value]) => {
      cssVars.push(`--duration-${key}: ${value};`);
    });

    Object.entries(tokens.animation.easing).forEach(([key, value]) => {
      if (typeof value === 'string') {
        cssVars.push(`--easing-${key}: ${value};`);
      } else {
        Object.entries(value).forEach(([subKey, subValue]) => {
          cssVars.push(`--easing-${key}-${subKey}: ${subValue};`);
        });
      }
    });

    // Shadows
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      cssVars.push(`--shadow-${key}: ${value};`);
    });

    // Border Radius
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      cssVars.push(`--radius-${key}: ${value};`);
    });

    // Breakpoints
    Object.entries(tokens.breakpoints).forEach(([key, value]) => {
      cssVars.push(`--breakpoint-${key}: ${value};`);
    });

    return `:root {\n  ${cssVars.join('\n  ')}\n}`;
  }

  private static addColorTokens(cssVars: string[], prefix: string, colors: Record<string, string>) {
    Object.entries(colors).forEach(([key, value]) => {
      cssVars.push(`--color-${prefix}-${key}: ${value};`);
    });
  }

  // Generate Tailwind-compatible token object
  static generateTailwindTokens(tokens: DesignTokens = designTokens): Record<string, any> {
    return {
      colors: {
        primary: tokens.colors.primary,
        gold: tokens.colors.gold,
        secondary: tokens.colors.secondary,
        neutral: tokens.colors.neutral,
        dark: tokens.colors.dark,
        success: tokens.colors.semantic.success,
        warning: tokens.colors.semantic.warning,
        error: tokens.colors.semantic.error,
        info: tokens.colors.semantic.info
      },
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      letterSpacing: tokens.typography.letterSpacing,
      spacing: tokens.spacing,
      transitionDuration: tokens.animation.duration,
      transitionTimingFunction: {
        'ease-out': tokens.animation.easing.easeOut,
        'ease-in-out': tokens.animation.easing.easeInOut,
        'sharp': tokens.animation.easing.sharp,
        'spring-gentle': tokens.animation.easing.spring.gentle,
        'spring-bouncy': tokens.animation.easing.spring.bouncy,
        'spring-firm': tokens.animation.easing.spring.firm
      },
      boxShadow: tokens.shadows,
      borderRadius: tokens.borderRadius,
      screens: tokens.breakpoints
    };
  }
}