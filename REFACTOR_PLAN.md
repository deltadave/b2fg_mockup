# D&D Beyond to Fantasy Grounds Converter - Refactoring Plan

## Current Architecture Problems

### Critical Issues:
1. **Massive Monolithic Function**: `characterParser.js` has a 3,217-line `parseCharacter()` function
2. **Global State Pollution**: 436 global variables in `appState.js` 
3. **No Separation of Concerns**: Character parsing, XML generation, and business logic mixed together
4. **Poor Testability**: Monolithic functions make unit testing impossible
5. **No Error Handling**: Inconsistent error handling throughout codebase

### Current File Structure:
- `characterParser.js` (3,217 lines) - Monolithic character processing
- `appState.js` (436 lines) - Global state variables
- `utilities.js` (985 lines) - Mixed utility functions
- `xmlTemplates.js` (5,051 lines) - XML template generation
- `spellSlots.js` (810 lines) - Spell slot calculations

## Technology Stack

### Core Stack
```json
{
  "frontend": {
    "framework": "Alpine.js 3.x",
    "styling": "Tailwind CSS", 
    "language": "TypeScript",
    "bundler": "Vite"
  },
  "development": {
    "testing": "Vitest",
    "linting": "ESLint + Prettier",
    "type-checking": "TypeScript strict mode"
  }
}
```

### Why This Stack
- **Alpine.js**: 15KB vs 87KB jQuery, perfect for reactive forms
- **Tailwind CSS**: Utility-first, pairs perfectly with Alpine.js
- **TypeScript**: Catch errors at compile time, better IDE support
- **Vite**: Lightning fast dev server, optimized builds

## Implementation Strategy: Strangler Fig Pattern

**Core Principle:** Build new architecture alongside existing code, gradually replacing old functionality using feature flags.

```
project/
├── legacy/           # Existing code (keep working)
│   ├── js/app.js
│   ├── js/characterParser.js  
│   └── js/utilities.js
├── devel/             # New refactored code
│   ├── domain/
│   ├── infrastructure/
│   └── presentation/
└── tests/           # New tests
```

## Phase 1: Foundation Setup

### Tasks:
1. **Set up modern tooling** without disrupting existing build
2. **Create new directory structure** for refactored code  
3. **Implement feature flag system** for gradual migration
4. **Set up dependency injection container**
5. **Establish testing framework**

### Feature Flag System:
```typescript
// src/infrastructure/FeatureFlags.ts
export class FeatureFlags {
    private static flags = {
        abilityScores: false,
        inventory: false,
        spells: false,
        characterParser: false,
        xmlGeneration: false,
        alpineUI: false
    };
    
    static isEnabled(feature: string): boolean {
        return this.flags[feature] ?? false;
    }
    
    static enable(feature: string): void {
        this.flags[feature] = true;
    }
}
```

### Dependency Injection Container:
```typescript
// src/infrastructure/DIContainer.ts
export class DIContainer {
    private services = new Map<string, any>();
    
    register<T>(name: string, implementation: new (...args: any[]) => T): void {
        this.services.set(name, implementation);
    }
    
    resolve<T>(name: string): T {
        const ServiceClass = this.services.get(name);
        if (!ServiceClass) throw new Error(`Service ${name} not found`);
        return new ServiceClass();
    }
}
```

## Phase 2: Feature-by-Feature Migration

### Step 1: Extract Ability Score Logic
```typescript
// src/domain/character/services/AbilityScoreCalculator.ts
export class AbilityScoreCalculator {
    calculateTotalScore(base: number, racial: number, feat: number, item: number): number {
        return base + racial + feat + item;
    }
    
    calculateModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }
    
    processAbilityScoreBonuses(character: Character): AbilityScores {
        // Extract existing logic from utilities.js processAbilityScoreBonuses()
        // Add comprehensive tests
        // Support Goliath racial bonuses, feat bonuses, etc.
    }
}

// Integration point in existing characterParser.js
function processCharacterAbilities(character) {
    if (FeatureFlags.isEnabled('abilityScores')) {
        const calculator = container.resolve('AbilityScoreCalculator');
        character.abilityScores = calculator.processAbilityScoreBonuses(character);
    } else {
        // Legacy: processAbilityScoreBonuses(character);
        processAbilityScoreBonuses(character);
    }
}
```

### Step 2: Extract Inventory/Encumbrance Logic  
```typescript
// src/domain/character/services/InventoryProcessor.ts
export class InventoryProcessor {
    processInventory(inventory: RawInventory[]): ProcessedInventory {
        // Extract logic from utilities.js processNestedInventoryXML()
        // Handle magic containers (weightMultiplier: 0)
        // Filter zero-quantity items
    }
    
    calculateEncumbrance(character: Character): Encumbrance {
        // Extract logic from utilities.js calculateEncumbrance()
        // Support Powerful Build trait for Goliaths
        // Handle magic container weight rules
    }
}
```

### Step 3: Extract Spell Processing
```typescript
// src/domain/character/services/SpellProcessor.ts
export class SpellProcessor {
    calculateSpellSlots(classes: CharacterClass[]): SpellSlots {
        // Extract logic from spellSlots.js
        // Handle multiclass spell slot calculation
        // Support Pact Magic for Warlocks
    }
}
```

### Step 4: Extract Character Parsing
```typescript
// src/domain/conversion/CharacterParser.ts
export class CharacterParser {
    async parseFromDNDBeyond(characterData: any): Promise<Character> {
        // Break down 3,217-line parseCharacter() function
        // Separate: basic info, race data, class data, equipment, spells
        // Use other extracted services
    }
}
```

### Step 5: Extract XML Generation
```typescript
// src/domain/export/XMLGenerator.ts
export class XMLGenerator {
    generateCharacterXML(character: Character): string {
        // Replace 5,051-line xmlTemplates.js with focused templates
        // Use Builder pattern for complex XML construction
    }
}
```

## Phase 3: UI Migration with Alpine.js

### Character Converter Component:
```typescript
// src/presentation/components/CharacterConverter.ts
interface CharacterConverterComponent {
    characterId: string;
    fgVersion: 'unity' | 'classic';
    isConverting: boolean;
    progress: number;
    currentStep: string;
    isValidId: boolean;
    
    validateCharacterId(): void;
    convertCharacter(): Promise<void>;
}

// Alpine.js component
function characterConverter(): CharacterConverterComponent {
    return {
        characterId: '',
        fgVersion: 'unity',
        isConverting: false,
        progress: 0,
        currentStep: '',
        isValidId: true,
        
        validateCharacterId() {
            const urlPattern = /dndbeyond\.com\/characters\/(\d+)/;
            const idPattern = /^\d+$/;
            this.isValidId = urlPattern.test(this.characterId) || idPattern.test(this.characterId);
        },
        
        async convertCharacter() {
            if (!FeatureFlags.isEnabled('alpineUI')) return;
            
            this.isConverting = true;
            try {
                const converter = new CharacterConverterFacade();
                converter.onProgress = (step, percent) => {
                    this.currentStep = step;
                    this.progress = percent;
                };
                
                const xml = await converter.convertFromDNDBeyond(this.characterId);
                Alpine.store('conversionResults').setResult(xml);
            } catch (error) {
                Alpine.store('notifications').addError(error.message);
            } finally {
                this.isConverting = false;
            }
        }
    }
}
```

### Alpine Stores for State Management:
```typescript
// src/presentation/stores/conversionResults.ts
Alpine.store('conversionResults', {
    result: null as string | null,
    filename: '',
    
    setResult(xml: string) {
        this.result = xml;
        this.filename = `character_${new Date().toISOString().slice(0, 10)}.xml`;
    },
    
    downloadXML() {
        if (!this.result) return;
        const blob = new Blob([this.result], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename;
        a.click();
        URL.revokeObjectURL(url);
    }
});
```

## Phase 4: Legacy Code Removal

### Migration Checklist for Each Feature:
```markdown
## [Feature] Migration Checklist

### Preparation
- [ ] Extract interface from legacy code
- [ ] Write comprehensive tests covering existing behavior  
- [ ] Create new implementation following SOLID principles
- [ ] Verify new implementation passes all tests

### Integration
- [ ] Add feature flag for this component
- [ ] Integrate new implementation alongside legacy
- [ ] Set up A/B testing with 10% traffic
- [ ] Monitor error rates and performance

### Rollout  
- [ ] Gradually increase traffic: 10% → 50% → 100%
- [ ] Monitor for 48 hours at each percentage
- [ ] Have rollback plan ready

### Cleanup
- [ ] Run at 100% new implementation for 1 week
- [ ] Remove feature flag code
- [ ] Delete legacy implementation
```

## Project Structure

```
src/
├── domain/
│   ├── character/
│   │   ├── models/
│   │   │   ├── Character.ts
│   │   │   ├── Race.ts  
│   │   │   ├── CharacterClass.ts
│   │   │   └── Equipment.ts
│   │   ├── services/
│   │   │   ├── AbilityScoreCalculator.ts
│   │   │   ├── InventoryProcessor.ts
│   │   │   └── SpellProcessor.ts
│   │   └── value-objects/
│   │       ├── AbilityScore.ts
│   │       └── Encumbrance.ts
│   ├── conversion/
│   │   ├── parsers/
│   │   │   └── CharacterParser.ts
│   │   └── strategies/
│   │       ├── GoliathStrategy.ts
│   │       └── BarbarianStrategy.ts
│   └── export/
│       ├── generators/
│       │   └── XMLGenerator.ts
│       └── templates/
│           ├── CharacterTemplate.ts
│           └── InventoryTemplate.ts
├── infrastructure/
│   ├── di/
│   │   └── DIContainer.ts
│   ├── errors/
│   │   └── ErrorHandler.ts
│   └── FeatureFlags.ts
├── presentation/
│   ├── components/
│   │   └── CharacterConverter.ts
│   └── stores/
│       ├── conversionResults.ts
│       └── notifications.ts
└── application/
    └── facades/
        └── CharacterConverterFacade.ts
```

## Code Standards

### TypeScript Configuration:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Alpine.js Standards:
- Type all Alpine components with interfaces
- One complex component per file
- Use Alpine stores for shared state
- camelCase for methods, kebab-case for HTML components

### Tailwind CSS Standards:
- Group utilities logically: layout, spacing, colors, typography
- Use `@apply` sparingly, prefer utilities
- Create component classes only for complex repeated patterns

### File Naming:
- `kebab-case` for files and directories
- Descriptive names: `ability-score-calculator.ts`
- Group by feature, not by file type

## Migration Benefits

### Immediate Value Each Step:
- **Step 1**: Testable ability score calculations with racial bonus support
- **Step 2**: Proper encumbrance with magic container support  
- **Step 3**: Clean spell slot calculations for multiclass characters
- **Step 4**: Maintainable character parsing with clear error handling
- **Step 5**: Efficient XML generation with proper templates

### Final Results:
- **90% reduction** in function complexity
- **100% unit test coverage** for business logic
- **Zero global variables** 
- **Type safety** throughout the application
- **15KB Alpine.js** vs 200KB+ jQuery + jqWidgets

## Phase 0: Environment Setup

### Complete Build System Configuration

**1. Create package.json**
```json
{
  "name": "dnd-beyond-to-fg-converter",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,js --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write src/**/*.{ts,js,html,css}",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "alpinejs": "^3.13.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "@typescript-eslint/parser": "^6.13.1",
    "@vitejs/plugin-legacy": "^5.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.2",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

**2. Create vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        contact: 'contact.html',
        donate: 'donate.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  }
});
```

**3. Create tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/legacy/*": ["js/*"]
    }
  },
  "include": ["src/**/*", "js/**/*", "*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**4. Create tailwind.config.js**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,html}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        'dnd-gold': '#D4AF37',
        'dnd-red': '#8B1538',
        'dnd-dark': '#1a1a1a'
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'inter': ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}
```

**5. Create .eslintrc.js**
```javascript
export default {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error'
  },
  ignorePatterns: ['dist/', 'js/', 'vendor/']
}
```

### Testing Infrastructure Setup

**6. Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/legacy': '/js'
    }
  }
});
```

**7. Create src/test/setup.ts**
```typescript
// Test setup and global mocks
import { beforeEach } from 'vitest';

// Mock DOM APIs that aren't available in jsdom
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now()
  }
});

// Reset global state before each test
beforeEach(() => {
  // Reset any global variables
  if (typeof window !== 'undefined') {
    window.startXML = '';
    window.allXML = '';
    window.pcFilename = '';
  }
});
```

**8. Create src/test/fixtures/character-data.ts**
```typescript
// Test data extracted from existing JSON files
export const testCharacterBasic = {
  id: 126060599,
  name: "Test Character",
  race: { fullName: "Human" },
  classes: [{ 
    definition: { name: "Fighter" },
    level: 5 
  }],
  stats: [
    { id: 1, value: 15 }, // STR
    { id: 2, value: 14 }, // DEX  
    { id: 3, value: 13 }, // CON
    { id: 4, value: 12 }, // INT
    { id: 5, value: 10 }, // WIS
    { id: 6, value: 8 }   // CHA
  ],
  bonusStats: [
    { id: 1, value: 2 }, // Racial STR bonus
    { id: 2, value: 0 },
    { id: 3, value: 1 }, // Feat CON bonus
    { id: 4, value: 0 },
    { id: 5, value: 0 },
    { id: 6, value: 0 }
  ]
};

export const testCharacterGoliath = {
  // Goliath test data for Powerful Build testing
  race: { fullName: "Goliath" },
  traits: [{ 
    definition: { name: "Powerful Build" }
  }]
};
```

## Integration Points Specification

### Feature Flag Integration Examples

**1. Exact Integration in characterParser.js**
```javascript
// Insert at line ~794 in characterParser.js
function processCharacterAbilities(character) {
    if (typeof FeatureFlags !== 'undefined' && FeatureFlags.isEnabled('abilityScores')) {
        // New implementation
        console.log('Using new ability score calculator');
        const calculator = window.DIContainer.resolve('AbilityScoreCalculator');
        return calculator.processAbilityScoreBonuses(character);
    } else {
        // Legacy implementation (existing code from utilities.js)
        console.log('Using legacy ability score processing');
        return processAbilityScoreBonuses(character);
    }
}
```

**2. Global State Bridge Pattern**
```typescript
// src/infrastructure/LegacyStateBridge.ts
export class LegacyStateBridge {
    static syncFromLegacy(): AppState {
        return {
            totalLevels: window.totalLevels || 0,
            isGoliath: window.isGoliath || 0,
            strScore: window.strScore || 0,
            // ... map all 436 variables
        };
    }
    
    static syncToLegacy(state: AppState): void {
        window.totalLevels = state.totalLevels;
        window.isGoliath = state.isGoliath ? 1 : 0;
        window.strScore = state.strScore;
        // ... sync back to globals
    }
}
```

### Dual-Mode Build Configuration

**3. Hybrid index.html**
```html
<!-- Add to head section after existing scripts -->
<script type="module">
  // Load new Alpine.js components only if feature flags enabled
  if (window.FeatureFlags?.isEnabled('alpineUI')) {
    import('./src/main.ts');
  }
</script>

<!-- Legacy fallback -->
<script>
  // Ensure legacy functionality works when new features disabled
  if (!window.FeatureFlags) {
    console.log('Running in legacy mode');
  }
</script>
```

## File-by-File Migration Strategy

### Priority Migration Order

**Phase 1A: Extract Core Utilities (Week 1)**
1. `getObjects()` from utilities.js → `src/shared/utils/object-search.ts`
2. `fixQuote()` from utilities.js → `src/shared/utils/string-sanitizer.ts`
3. `safeAccess()` from characterParser.js → `src/shared/utils/safe-access.ts`
4. `justAbilities` from gameConstants.js → `src/domain/character/constants.ts`

**Phase 1B: Extract Ability Score Logic (Week 2)**
```typescript
// Migration target: processAbilityScoreBonuses() from utilities.js lines 780-830
// Dependencies: justAbilities, character.bonusStats, character.modifiers
// Test with: Goliath racial bonuses, feat bonuses
```

### Specific Function Extraction Examples

**1. Extract getObjects Function**
```typescript
// src/shared/utils/object-search.ts
export class ObjectSearch {
    /**
     * Recursively search through an object for properties matching criteria
     * Migrated from utilities.js getObjects() function
     */
    static find<T = any>(obj: unknown, key: string, val: string): T[] {
        const objects: T[] = [];
        const stack = [obj];
        
        while (stack.length > 0) {
            const current = stack.pop();
            
            if (current && typeof current === 'object') {
                for (const property in current) {
                    if (current.hasOwnProperty(property)) {
                        if (key === "" || property === key) {
                            if (val === "" || current[property] === val) {
                                objects.push(current as T);
                            }
                        }
                        
                        if (typeof current[property] === 'object') {
                            stack.push(current[property]);
                        }
                    }
                }
            }
        }
        
        return objects;
    }
}

// Test file: src/test/unit/object-search.test.ts
import { describe, it, expect } from 'vitest';
import { ObjectSearch } from '@/shared/utils/object-search';
import { testCharacterBasic } from '@/test/fixtures/character-data';

describe('ObjectSearch', () => {
    it('should find abilities by id', () => {
        const results = ObjectSearch.find(testCharacterBasic, 'id', '1');
        expect(results).toHaveLength(2); // stat and bonusStat
    });
});
```

**2. Extract Ability Score Calculator**
```typescript
// src/domain/character/services/AbilityScoreCalculator.ts
export interface AbilityScore {
    id: number;
    name: string;
    base: number;
    racial: number;
    feat: number;
    item: number;
    total: number;
    modifier: number;
}

export class AbilityScoreCalculator {
    private readonly abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    
    calculateModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }
    
    processAbilityScoreBonuses(character: any): AbilityScore[] {
        console.log('New AbilityScoreCalculator processing bonuses');
        
        const results: AbilityScore[] = [];
        
        // Process each ability
        this.abilities.forEach((abilityName, index) => {
            const abilityId = index + 1;
            const baseStat = character.stats?.find((s: any) => s.id === abilityId);
            const bonusStat = character.bonusStats?.find((s: any) => s.id === abilityId);
            
            const base = baseStat?.value || 10;
            let racial = 0;
            let feat = 0;
            let item = 0;
            
            // Extract bonuses from modifiers (migrated logic from utilities.js:802-821)
            const modifierSources = ['race', 'class', 'background', 'item', 'feat'];
            modifierSources.forEach(source => {
                if (character.modifiers?.[source]) {
                    character.modifiers[source].forEach((modifier: any) => {
                        if (modifier.type === "bonus" && modifier.subType === `${abilityName}-score`) {
                            const bonus = parseInt(modifier.fixedValue) || 0;
                            if (bonus > 0) {
                                switch(source) {
                                    case 'race': racial += bonus; break;
                                    case 'feat': feat += bonus; break;
                                    case 'item': item += bonus; break;
                                }
                            }
                        }
                    });
                }
            });
            
            // Add existing bonus stats (legacy compatibility)
            if (bonusStat?.value) {
                racial += bonusStat.value;
            }
            
            const total = base + racial + feat + item;
            
            results.push({
                id: abilityId,
                name: abilityName,
                base,
                racial,
                feat,
                item,
                total,
                modifier: this.calculateModifier(total)
            });
        });
        
        return results;
    }
}

// Integration test: src/test/integration/ability-scores.test.ts
import { describe, it, expect } from 'vitest';
import { AbilityScoreCalculator } from '@/domain/character/services/AbilityScoreCalculator';
import { testCharacterBasic, testCharacterGoliath } from '@/test/fixtures/character-data';

describe('AbilityScoreCalculator Integration', () => {
    it('should match legacy output for basic character', () => {
        const calculator = new AbilityScoreCalculator();
        const results = calculator.processAbilityScoreBonuses(testCharacterBasic);
        
        // Verify against known expected values
        expect(results[0]).toEqual({
            id: 1,
            name: 'strength',
            base: 15,
            racial: 2,
            feat: 0,
            item: 0,
            total: 17,
            modifier: 3
        });
    });
});
```

### Rollback Procedures

**For Each Migration Step:**
```markdown
## Rollback Checklist for [Feature]

### Immediate Rollback (< 5 minutes)
1. Set feature flag to false: `FeatureFlags.disable('[feature]')`
2. Clear browser cache: Force refresh (Ctrl+F5)
3. Verify legacy functionality works
4. Monitor error logs for 10 minutes

### Full Rollback (if feature flag fails)
1. Git revert to last working commit
2. Re-deploy static files
3. Restore backups if necessary
4. Document rollback reason and lessons learned

### Rollback Triggers
- Error rate > 1% for 5 minutes
- User reports of broken functionality
- Performance degradation > 20%
- Memory leaks detected
```

### Error Handling Strategy

**Global Error Boundary**
```typescript
// src/infrastructure/ErrorHandler.ts
export class ErrorHandler {
    static handleLegacyIntegrationError(error: Error, context: string): void {
        console.error(`Legacy integration error in ${context}:`, error);
        
        // Graceful degradation
        if (context.includes('abilityScores')) {
            FeatureFlags.disable('abilityScores');
            window.location.reload(); // Fallback to legacy
        }
        
        // Report to monitoring (future enhancement)
        this.reportError(error, context);
    }
    
    private static reportError(error: Error, context: string): void {
        // Future: Send to error tracking service
        console.log('Error reported:', { error: error.message, context });
    }
}
```

## Getting Started - Complete Implementation Guide

### Prerequisites Installation:
```bash
# Initialize npm project
npm init -y

# Install all dependencies
npm install alpinejs
npm install -D vite @vitejs/plugin-legacy typescript tailwindcss autoprefixer postcss
npm install -D vitest @vitest/ui jsdom @types/node
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier

# Initialize Tailwind
npx tailwindcss init
```

### Exact First Steps:
1. **Create build system files** (package.json, vite.config.ts, tsconfig.json)
2. **Set up directory structure:**
   ```
   mkdir -p src/{domain/{character/{services,models,constants},conversion,export},infrastructure,presentation/{components,stores},shared/utils,test/{unit,integration,fixtures}}
   ```
3. **Extract first utility function** (`getObjects` → `ObjectSearch.find`)
4. **Create feature flags system** with integration in characterParser.js line 794
5. **Extract ability score calculator** with comprehensive tests
6. **Enable ability score feature flag** and A/B test with 10% traffic

### Success Criteria for Each Phase:
- **Phase 0**: All builds pass, legacy functionality unchanged
- **Phase 1**: First extracted service passes all tests, feature flag works
- **Phase 2**: 50% of utilities.js extracted with zero regressions
- **Phase 3**: Alpine.js components functional alongside jQuery
- **Phase 4**: 100% legacy code removed, full TypeScript coverage

This enhanced plan provides the granular detail needed for systematic implementation with clear rollback strategies and integration points.
