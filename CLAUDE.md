# CLAUDE.md

This file provides comprehensive guidance for TypeScript development work on the D&D Beyond Character Converter project.

## Project Overview & Context

### Application Purpose
The D&D Beyond Character Converter is a client-side web application that **eliminates 90% of character setup time** when moving from D&D Beyond to virtual tabletop platforms. It fetches character data from D&D Beyond's API and converts it to multiple output formats:

- **Fantasy Grounds XML** (production-ready)
- **Foundry VTT JSON** (in development) 
- **Roll20 JSON** (planned)
- **Generic JSON** (planned)

### Target Users & Metrics
- **Primary**: D&D Beyond subscribers using Fantasy Grounds (50,000+ active users)
- **Secondary**: D&D Beyond users wanting to try virtual tabletops
- **Success Target**: <2 minutes conversion time, >95% data accuracy, >4.5/5 user satisfaction

### Current Architecture Status
- **Legacy System**: Working 3,200+ line characterParser.js with complete Fantasy Grounds support
- **Modern System**: TypeScript + Alpine.js + Vite architecture with domain-driven design
- **Migration Strategy**: Strangler Fig pattern with feature flags for gradual modernization

## TypeScript Development Guidelines

### Type Safety Standards

**Strict Configuration Required**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Core Domain Types**
```typescript
// D&D 5e domain modeling
type AbilityScoreName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
type SkillName = 'acrobatics' | 'animalHandling' | 'arcana' /* ... all D&D skills */;
type DamageType = 'acid' | 'bludgeoning' | 'cold' /* ... all damage types */;

// Branded types for ID safety
type CharacterId = string & { readonly brand: 'CharacterId' };
type SpellId = string & { readonly brand: 'SpellId' };

// Character data interfaces
interface CharacterData {
  readonly id: CharacterId;
  readonly name: string;
  readonly race?: RaceData;
  readonly classes?: ReadonlyArray<ClassData>;
  readonly stats?: ReadonlyArray<AbilityScore>;
  readonly inventory?: ReadonlyArray<InventoryItem>;
  readonly spells?: SpellData;
  readonly features?: ReadonlyArray<FeatureData>;
}

// Conversion pipeline types
interface ConversionResult {
  readonly success: boolean;
  readonly character?: NormalizedCharacter;
  readonly warnings?: ReadonlyArray<ValidationWarning>;
  readonly errors?: ReadonlyArray<ConversionError>;
  readonly performance?: PerformanceMetrics;
}
```

### Alpine.js Integration Patterns

**Component Interface Standards**
```typescript
interface AlpineComponent {
  // State properties
  [key: string]: any;
  
  // Required lifecycle methods
  init?(): void;
  destroy?(): void;
  
  // Error handling
  handleError?(error: ComponentError): void;
}

// Character converter component example
Alpine.data('characterConverter', (): CharacterConverterComponent => ({
  // Form state
  characterId: '',
  selectedFormat: 'fantasy-grounds' as OutputFormat,
  
  // UI state  
  isConverting: false,
  progress: 0,
  currentStep: '',
  
  // Validation
  isValidId: false,
  validationMessage: '',
  
  init() {
    this.$watch('characterId', () => this.validateCharacterId());
    this.$el.addEventListener('keydown', this.handleKeydown.bind(this));
  },
  
  async convertCharacter() {
    if (!this.isValidId || this.isConverting) return;
    
    try {
      this.isConverting = true;
      const result = await this.facade.convertCharacter({
        characterId: this.characterId,
        format: this.selectedFormat
      });
      
      if (result.success) {
        this.handleSuccess(result);
      } else {
        this.handleErrors(result.errors);
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isConverting = false;
    }
  }
}));
```

### Module Structure & Import Patterns

**Domain-Driven File Organization**
```
src/
├── application/
│   └── facades/CharacterConverterFacade.ts     # Main orchestration layer
├── domain/
│   ├── character/                              # Character processing domain
│   │   ├── models/                            # Character data models
│   │   ├── services/                          # Character processors
│   │   └── constants/                         # D&D 5e constants
│   ├── conversion/                            # Conversion logic domain
│   │   ├── mappers/                          # Data transformation
│   │   ├── processors/                       # Rule processors
│   │   └── validators/                       # Data validation
│   └── export/                                # Output generation domain
│       ├── formatters/                       # Format-specific generators
│       ├── interfaces/                       # Output contracts
│       └── registry/                         # Format registry
├── infrastructure/
│   ├── api/                                  # External API clients
│   └── monitoring/                           # Performance tracking
├── presentation/
│   ├── components/                           # Alpine.js components
│   └── stores/                               # State management
└── shared/
    ├── types/                                # Shared type definitions
    ├── utils/                                # Utility functions
    └── constants/                            # Application constants
```

**Import Best Practices**
```typescript
// Use barrel exports for clean imports
export { CharacterFetcher } from './services/CharacterFetcher';
export { AbilityScoreProcessor } from './services/AbilityScoreProcessor';
export type { ICharacterFetcher } from './services/CharacterFetcher';

// Import patterns
import type { CharacterData, ConversionResult } from '@/domain/character';
import { CharacterConverterFacade } from '@/application/facades/CharacterConverterFacade';
import { Logger } from '@/shared/utils/Logger';
```

## Development Standards

### Code Style & Formatting

**Required Tools**
- **TypeScript 4.9+** with strict mode enabled
- **Prettier** for code formatting  
- **ESLint** with TypeScript rules (currently disabled, should be re-enabled)
- **Vitest** for unit testing

**Architectural Patterns**
```typescript
// Strategy Pattern - Output formatters
interface OutputFormatter {
  readonly format: string;
  readonly supportedFeatures: ReadonlyArray<string>;
  generateOutput(character: NormalizedCharacter): Promise<FormatResult>;
  validateOutput(output: string): ValidationResult;
}

// Facade Pattern - Simplified API
class CharacterConverterFacade {
  constructor(
    private readonly characterFetcher: ICharacterFetcher,
    private readonly conversionOrchestrator: IConversionOrchestrator,
    private readonly formatRegistry: IFormatRegistry,
    private readonly progressTracker: IProgressTracker
  ) {}
  
  async convertCharacter(request: ConversionRequest): Promise<ConversionResult> {
    // Orchestrate conversion process with proper error handling
  }
}

// Chain of Responsibility - Character processing
abstract class CharacterProcessor {
  protected next?: CharacterProcessor;
  
  setNext(processor: CharacterProcessor): CharacterProcessor {
    this.next = processor;
    return processor;
  }
  
  async process(character: CharacterData): Promise<ProcessingResult> {
    const result = await this.doProcess(character);
    return this.next ? result.merge(await this.next.process(character)) : result;
  }
  
  protected abstract doProcess(character: CharacterData): Promise<ProcessingResult>;
}
```

### Testing Approaches & Patterns

**Unit Testing Standards**
```typescript
// Required test coverage for all new components
describe('AbilityScoreProcessor', () => {
  let processor: AbilityScoreProcessor;
  let mockCharacterData: CharacterData;
  
  beforeEach(() => {
    processor = new AbilityScoreProcessor();
    mockCharacterData = createTestCharacterData();
  });
  
  it('should calculate ability modifiers correctly', () => {
    const result = processor.calculateModifier(16);
    expect(result).toBe(3);
  });
  
  it('should handle multiclass ability score improvements', async () => {
    const multiclassCharacter = createMulticlassTestData();
    const result = await processor.processAbilities(multiclassCharacter);
    
    expect(result.strength.totalValue).toBe(18);
    expect(result.strength.modifier).toBe(4);
  });
});
```

**Integration Testing**
```typescript
// Test conversion pipeline end-to-end
describe('Character Conversion Integration', () => {
  it('should convert Fantasy Grounds character successfully', async () => {
    const facade = new CharacterConverterFacade(dependencies);
    const result = await facade.convertCharacter({
      characterId: testCharacterId,
      format: 'fantasy-grounds'
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toContain('<character>');
    expect(result.warnings).toHaveLength(0);
  });
});
```

### Performance Considerations

**Optimization Patterns**
```typescript
// Memoization for expensive calculations
class MemoizedSpellSlotCalculator {
  private cache = new Map<string, SpellSlots>();
  
  calculateSpellSlots(classes: ClassData[]): SpellSlots {
    const key = this.getCacheKey(classes);
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const result = this.performCalculation(classes);
    this.cache.set(key, result);
    return result;
  }
}

// Lazy loading for format-specific code
class FormatLoaderService {
  async getFormatter(format: string): Promise<OutputFormatter> {
    switch (format) {
      case 'fantasy-grounds':
        return (await import('@/domain/export/formatters/FantasyGroundsFormatter')).FantasyGroundsFormatter;
      case 'foundry-vtt':
        return (await import('@/domain/export/formatters/FoundryVTTFormatter')).FoundryVTTFormatter;
    }
  }
}
```

### Security Requirements

**Input Validation & Sanitization**
```typescript
class CharacterIdValidator {
  private static readonly VALID_ID_PATTERN = /^\d+$/;
  private static readonly MAX_ID_LENGTH = 20;
  
  static validate(input: string): ValidationResult {
    if (!input || typeof input !== 'string') {
      return ValidationResult.failure('Character ID is required');
    }
    
    if (!this.VALID_ID_PATTERN.test(input)) {
      return ValidationResult.failure('Character ID must contain only numbers');
    }
    
    return ValidationResult.success();
  }
  
  static sanitize(input: string): string {
    return input.replace(/[^\d]/g, '').slice(0, this.MAX_ID_LENGTH);
  }
}

class StringSanitizer {
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  static sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input;
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return this.encodeHtmlEntities(sanitized).slice(0, 1000);
  }
}
```

## Key Reference Information

### Important File Locations

**Legacy System (Stable)**
- `legacy/js/characterParser.js` - Main conversion logic (3,200+ lines)
- `legacy/js/gameConstants.js` - D&D 5e rules and constants
- `legacy/js/appState.js` - Global application state
- `legacy/js/utilities.js` - Performance monitoring and data traversal

**Modern System (In Development)**
- `devel/src/application/facades/CharacterConverterFacade.ts` - Main orchestration
- `devel/src/domain/character/services/` - Character processing services  
- `devel/src/domain/export/formatters/` - Output format generators
- `devel/src/presentation/components/` - Alpine.js UI components
- `devel/src/test/` - Comprehensive test suite

**Configuration Files**
- `devel/tsconfig.json` - TypeScript configuration
- `devel/vite.config.ts` - Build configuration
- `devel/vitest.config.ts` - Test configuration
- `devel/tailwind.config.js` - Styling configuration

### API Endpoints & Data Formats

**D&D Beyond Integration**
- **API Endpoint**: `https://character-service.dndbeyond.com/character/v5/character/{id}`
- **CORS Proxy**: `https://uakari-indigo.fly.dev/` (third-party service)
- **Character ID Format**: Numeric ID extracted from D&D Beyond URLs
- **Rate Limiting**: 10 requests per minute (implemented client-side)

**Output Formats**
- **Fantasy Grounds**: XML format with embedded character data, spells, equipment
- **Foundry VTT**: JSON Actor format with embedded Items and Active Effects
- **Character ID Pattern**: `/^\d{8,12}$/` (8-12 digit numeric IDs)

### Component Patterns & Usage

**Design System Integration**
```typescript
// Use design tokens for all styling
const styles = {
  // Colors
  primary: 'var(--color-primary-500)',      // #8B1538 D&D Burgundy
  gold: 'var(--color-gold-500)',            // #D4AF37 D&D Gold
  success: 'var(--color-success)',          // #059669
  error: 'var(--color-error)',              // #DC2626
  
  // Typography
  fontPrimary: 'var(--font-family-primary)', // Inter
  fontDisplay: 'var(--font-family-display)', // Cinzel
  fontMono: 'var(--font-family-mono)',       // JetBrains Mono
  
  // Spacing
  spacingSm: 'var(--space-sm)',             // 8px
  spacingMd: 'var(--space-md)',             // 16px
  spacingLg: 'var(--space-lg)',             // 24px
  spacingXl: 'var(--space-xl)',             // 32px
};
```

**Accessibility Requirements (WCAG AA)**
```html
<!-- Required semantic structure -->
<form 
  x-data="characterConverter"
  aria-labelledby="conversion-form-title"
  novalidate
>
  <h2 id="conversion-form-title">Character Conversion</h2>
  
  <label for="character-url" class="form-label">
    D&D Beyond Character URL
    <span class="required" aria-label="required">*</span>
  </label>
  
  <input
    type="url"
    id="character-url"
    x-model="characterId"
    aria-describedby="url-help"
    :aria-invalid="!isValidId && characterId.length > 0"
    required
  >
  
  <div id="url-help" class="help-text">
    Example: https://www.dndbeyond.com/characters/12345678
  </div>
  
  <!-- Progress indication -->
  <div 
    x-show="isConverting"
    role="progressbar"
    :aria-valuenow="progress"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`Conversion progress: ${progress}%`"
  >
    <div class="progress-bar">
      <div :style="`width: ${progress}%`"></div>
    </div>
  </div>
  
  <!-- Live status updates -->
  <div aria-live="polite" class="sr-only" x-text="currentStep"></div>
</form>
```

### Common Development Tasks & Workflows

**Adding New Output Format**
1. Create formatter class implementing `OutputFormatter` interface
2. Add format registration to `FormatRegistry`  
3. Create UI component for format-specific options
4. Add comprehensive tests including validation
5. Update documentation and type definitions

**Extending Character Processing**
1. Identify domain (character, conversion, export)
2. Create service class with single responsibility
3. Add to processing chain via Chain of Responsibility pattern
4. Write unit tests with mock dependencies
5. Add integration tests with real character data

**Creating New UI Component**
1. Define TypeScript interface for component state
2. Implement Alpine.js component with accessibility
3. Create CSS using design tokens and BEM methodology
4. Add comprehensive tests (unit + integration + accessibility)
5. Document component API and usage patterns

## Implementation Priorities

### Current Development Focus Areas

**Phase 1: Foundation & Integration (P0 - Critical)**
1. Complete CharacterConverterFacade 
2. Finish Foundry VTT JSON formatter implementation
3. Enhance error handling with user-friendly messages  
4. Complete character validation system

**Phase 2: Format Expansion (P1 - High)** 
1. Implement multi-format export system (Fantasy Grounds Unity, FoundryVTT, Roll20, Generic JSON)
2. Add batch character processing capabilities
3. Create advanced validation with accuracy reporting
4. Enhance UI with format compatibility matrix

**Phase 3: Architecture Modernization (P1 - High)**
1. Migrate legacy parser using Strangler Fig pattern
2. Complete modern service layer implementation  
3. Optimize performance with caching and lazy loading
4. Enhanced Alpine.js store architecture

**Phase 4: Advanced Features (P2 - Medium)**
1. Character comparison and difference highlighting
2. Browser extension for direct D&D Beyond integration
3. Complex character features (multiclass, homebrew content)
4. API monitoring and fallback systems

### Critical Path Dependencies

```
CharacterConverterFacade → Foundry Formatter → Multi-Format System
         ↓                        ↓                    ↓
Error Enhancement → Validation System → Legacy Migration
         ↓                        ↓                    ↓  
Character Preview → Modern Services → Character Comparison
```

### Success Metrics
- **Conversion Success Rate**: >95% for standard characters
- **Performance**: <20 seconds total conversion time
- **User Experience**: <2 minutes from URL input to download
- **Format Support**: 100% Fantasy Grounds, 95% Foundry VTT feature coverage
- **Code Quality**: >90% test coverage, 100% TypeScript strict mode
- **Accessibility**: WCAG AA compliance across all components

This CLAUDE.md file serves as the comprehensive reference for efficient TypeScript development on the D&D Beyond Character Converter, ensuring consistency, quality, and alignment with project goals while maintaining the working legacy system during modernization.