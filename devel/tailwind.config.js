// Tailwind CSS Configuration - Integrated with Design System Tokens
// Updated for Phase 1 Foundation implementation

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,html}",
    "!./src/presentation/stores",
    "./*.html"
  ],
  theme: {
    extend: {
      // Colors - Design System Token Integration
      colors: {
        // Primary Burgundy Scale
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
        // D&D Gold Scale
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
        // Fantasy Blue Scale
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
        // Semantic Colors
        success: '#059669',
        warning: '#D97706', 
        error: '#DC2626',
        info: '#0EA5E9',
        // Enhanced Neutral Scale
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
        // Dark Mode Scale
        dark: {
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Legacy Colors (maintained for compatibility)
        'dnd-gold': '#D4AF37',
        'dnd-red': '#8B1538', 
        'dnd-dark': '#1a1a1a'
      },
      
      // Typography - Design System Integration
      fontFamily: {
        primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Cinzel', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        // Legacy font families (maintained for compatibility)
        'cinzel': ['Cinzel', 'serif'],
        'inter': ['Inter', 'sans-serif']
      },
      
      fontSize: {
        'h1': ['3.5rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'h2': ['2.5rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'h3': ['2rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        'h4': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'h5': ['1.25rem', { lineHeight: '1.6' }],
        'body-large': ['1.125rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-small': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
        'label': ['0.875rem', { lineHeight: '1.3', letterSpacing: '0.05em' }],
        'code': ['0.875rem', { lineHeight: '1.6' }],
        'button': ['1rem', { lineHeight: '1.2' }],
      },
      
      // Spacing - Design System Scale
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px  
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32px
        '2xl': '3rem',     // 48px
        '3xl': '4rem',     // 64px
      },
      
      // Animation - Design System Timing
      transitionDuration: {
        'micro': '150ms',
        'local': '250ms', 
        'page': '350ms',
        'complex': '600ms',
      },
      
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'spring-gentle': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-bouncy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring-firm': 'cubic-bezier(0.2, 0, 0.38, 0.9)',
      },
      
      // Shadows - Design System Elevation
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 12px rgba(139, 21, 56, 0.2)',
        'lg': '0 8px 24px rgba(139, 21, 56, 0.1)',
        'xl': '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
      
      // Border Radius - Design System Scale
      borderRadius: {
        'sm': '0.5rem',   // 8px
        'md': '0.75rem',  // 12px
        'lg': '1rem',     // 16px
        'xl': '1.5rem',   // 24px
      },
      
      // Breakpoints - Design System Responsive Scale
      screens: {
        'mobile': '320px',
        'tablet': '768px', 
        'desktop': '1024px',
        'wide': '1440px',
      },
      
      // Grid and Layout
      maxWidth: {
        'container': '1200px',
      },
      
      // Component Heights
      height: {
        'button': '3rem',    // 48px - WCAG touch target
        'input': '3rem',     // 48px - WCAG touch target
        'nav': '4rem',       // 64px - Primary navigation
      },
      
      minHeight: {
        'touch-target': '44px', // WCAG AA minimum touch target
      },
      
      minWidth: {
        'touch-target': '44px', // WCAG AA minimum touch target
      },
    }
  },
  
  plugins: [
    // Custom plugin for design system utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Hardware acceleration utilities
        '.hardware-accelerated': {
          transform: 'translateZ(0)',
          willChange: 'transform',
        },
        
        // Focus utilities
        '.focus-ring': {
          '&:focus-visible': {
            outline: `2px solid ${theme('colors.gold.500')}`,
            outlineOffset: '2px',
          }
        },
        
        // Touch target utilities
        '.touch-target': {
          minHeight: theme('minHeight.touch-target'),
          minWidth: theme('minWidth.touch-target'),
        },
        
        // Screen reader utilities
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px', 
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
      }
      
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ]
}