# D&D Beyond to Fantasy Grounds Converter - Refactoring Plan

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
    ├── domain/
    ├── infrastructure/
    └── presentation/
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

## Phase 2: Feature-by-Feature Migration with XML Integration

**CRITICAL PRINCIPLE**: Each extracted feature MUST include XML generation integration for immediate testing and validation. This ensures each service produces visible, testable output rather than deferring integration to later phases.

### Step 1: Extract Ability Score Logic + XML Export
```typescript
// src/domain/character/services/AbilityScoreProcessor.ts
export class AbilityScoreProcessor {
    calculateTotalScore(base: number, racial: number, feat: number, item: number): number {
        return base + racial + feat + item;
    }
    
    calculateModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }
    
    processAbilityScoreBonuses(character: Character): ProcessedAbilityScores {
        // Extract existing logic from utilities.js processAbilityScoreBonuses()
        // Add comprehensive tests
        // Support Goliath racial bonuses, feat bonuses, etc.
        return processedScores;
    }

    // XML GENERATION - REQUIRED FOR EACH FEATURE
    generateAbilityScoresXML(scores: ProcessedAbilityScores): string {
        // Generate Fantasy Grounds compatible XML for ability scores
        // Include base scores, modifiers, and racial bonuses
        // Support proficiency bonuses and saving throws
    }
}

// CharacterConverterFacade Integration - IMMEDIATE XML OUTPUT
private generateAbilitiesXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('ability_score_processor')) {
        const processor = new AbilityScoreProcessor();
        const scores = processor.processAbilityScoreBonuses(characterData);
        return processor.generateAbilityScoresXML(scores);
    } else {
        return '<!-- Legacy ability score processing -->';
    }
}
```

**✅ VALIDATION REQUIREMENTS:**
- Ability scores appear correctly in generated XML
- Racial bonuses (Goliaths, Variant Humans) properly calculated
- Modifiers and saving throws accurate
- Feature flag toggles between new/legacy seamlessly

### Step 2: Extract Inventory/Encumbrance Logic + XML Export
```typescript
// src/domain/character/services/InventoryProcessor.ts
export class InventoryProcessor {
    processInventory(inventory: RawInventory[]): InventoryProcessingResult {
        // Extract logic from utilities.js processNestedInventoryXML()
        // Handle magic containers (weightMultiplier: 0)
        // Filter zero-quantity items
        return { nestedStructure, xmlResult, statistics };
    }
    
    // XML GENERATION - REQUIRED FOR EACH FEATURE  
    generateInventoryXML(structure: NestedInventoryStructure): string {
        // Generate Fantasy Grounds flat inventory structure
        // Use <location> tags for container relationships
        // Proper item properties, costs, weights
    }
}

// src/domain/character/services/EncumbranceCalculator.ts
export class EncumbranceCalculator {
    calculateEncumbrance(character: CharacterStrength, inventory: InventoryItem[]): EncumbranceCalculation {
        // Extract logic from utilities.js calculateEncumbrance()
        // Support Powerful Build trait for Goliaths
        // Handle magic container weight rules
        return encumbranceResult;
    }

    // XML GENERATION - REQUIRED FOR EACH FEATURE
    generateEncumbranceXML(encumbrance: EncumbranceCalculation): string {
        // Generate Fantasy Grounds encumbrance section
        // Include carrying capacity, current load, thresholds
    }
}

// CharacterConverterFacade Integration - IMMEDIATE XML OUTPUT
private generateInventoryXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('inventory_processor')) {
        const result = this.inventoryProcessor.processInventory(inventory, characterId);
        return result.xmlResult.xml;
    } else {
        return '<inventorylist><!-- Legacy inventory processing --></inventorylist>';
    }
}

private generateEncumbranceXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('encumbrance_calculator')) {
        const result = this.encumbranceCalculator.calculateEncumbrance(character, inventory);
        return this.formatEncumbranceForXML(result);
    } else {
        return '<!-- Legacy encumbrance processing -->';
    }
}
```

**✅ VALIDATION REQUIREMENTS:**
- Inventory items appear in generated XML with correct structure
- Container relationships use `<location>` tags, not nested lists
- Magic containers (Bag of Holding) properly handle weightMultiplier=0
- Encumbrance values reflect actual character strength and racial traits
- Goliath Powerful Build correctly doubles carrying capacity

### Step 3: Extract Spell Processing + XML Export
```typescript
// src/domain/character/services/SpellSlotCalculator.ts
export class SpellSlotCalculator {
    calculateSpellSlots(classes: CharacterClass[]): SpellSlotCalculationResult {
        // Extract logic from spellSlots.js
        // Handle multiclass spell slot calculation
        // Support Pact Magic for Warlocks
        return { spellSlots, debugInfo };
    }
    
    // XML GENERATION - REQUIRED FOR EACH FEATURE
    generateSpellSlotsXML(result: SpellSlotCalculationResult): string {
        // Generate Fantasy Grounds spell slot XML
        // Include regular spell slots and warlock pact magic
        // Proper powergroup and powermeta structure
    }
}

// CharacterConverterFacade Integration - IMMEDIATE XML OUTPUT
private generateSpellSlotsXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('spell_slot_calculator')) {
        const classInfo = this.extractClassInfo(characterData);
        const result = SpellSlotCalculator.calculateSpellSlots(classInfo);
        return this.formatSpellSlotsForXML(result);
    } else {
        return '<!-- Legacy spell slot processing -->';
    }
}
```

**✅ VALIDATION REQUIREMENTS:**
- Spell slots appear in powergroup/powermeta XML sections
- Multiclass spell slot calculation follows D&D 5e rules
- Warlock pact magic generates separate XML structure
- Feature flag enables/disables spell slot processing seamlessly

### Step 4: Extract Class/Race Feature Processing + XML Export
```typescript
// src/domain/character/services/FeatureProcessor.ts
export class FeatureProcessor {
    processClassFeatures(character: Character): ProcessedFeatures {
        // Extract class feature detection and processing
        // Handle barbarian rage, fighter maneuvers, etc.
        // Support subclass variations (totem warrior, champion, etc.)
        return processedFeatures;
    }
    
    processRacialTraits(character: Character): ProcessedTraits {
        // Extract racial trait processing
        // Handle darkvision, fey ancestry, powerful build, etc.
        return processedTraits;
    }
    
    // XML GENERATION - REQUIRED FOR EACH FEATURE
    generateFeaturesXML(features: ProcessedFeatures): string {
        // Generate Fantasy Grounds feature list XML
        // Include proper feature descriptions and mechanics
    }
}

// CharacterConverterFacade Integration - IMMEDIATE XML OUTPUT
private generateFeaturesXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('feature_processor')) {
        const processor = new FeatureProcessor();
        const features = processor.processClassFeatures(characterData);
        const traits = processor.processRacialTraits(characterData);
        return processor.generateFeaturesXML({ ...features, ...traits });
    } else {
        return '<featlist><!-- Legacy feature processing --></featlist>';
    }
}
```

**✅ VALIDATION REQUIREMENTS:**
- Class features appear correctly in XML with proper descriptions
- Racial traits (darkvision, fey ancestry) properly formatted
- Subclass features (totem spirits, fighting styles) included
- Feature mechanics and usage limitations documented in XML

### Step 5: Extract Character Data Parsing + XML Export
```typescript
// src/domain/character/services/CharacterDataProcessor.ts
export class CharacterDataProcessor {
    processBasicInfo(ddbData: any): BasicCharacterInfo {
        // Extract basic character information processing
        // Handle name, level, race, class, background
        return basicInfo;
    }
    
    processLanguagesAndProficiencies(ddbData: any): LanguageProficiencyResult {
        // Extract languages and proficiencies
        // Handle tool proficiencies, languages, armor/weapon proficiencies
        return languageProfResult;
    }
    
    // XML GENERATION - REQUIRED FOR EACH FEATURE
    generateCharacterInfoXML(info: BasicCharacterInfo): string {
        // Generate basic character information XML
        // Include properly sanitized names, descriptions
    }
    
    generateLanguagesXML(langProf: LanguageProficiencyResult): string {
        // Generate languages and proficiencies XML
        // Include tool proficiencies and skill bonuses
    }
}

// CharacterConverterFacade Integration - IMMEDIATE XML OUTPUT  
private generateLanguagesXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('character_data_processor')) {
        const processor = new CharacterDataProcessor();
        const langProf = processor.processLanguagesAndProficiencies(characterData);
        return processor.generateLanguagesXML(langProf);
    } else {
        return '<languagelist><!-- Legacy language processing --></languagelist>';
    }
}
```

**✅ VALIDATION REQUIREMENTS:**
- Character basic info (name, race, class) appears correctly in XML
- Languages list includes all character languages
- Tool and weapon proficiencies properly categorized
- Skill proficiencies reflect class, race, and background bonuses

## REVISED APPROACH: XML-First Feature Development

**KEY PRINCIPLE CHANGE**: Each feature extraction now includes immediate XML integration, not deferred to later phases. This approach provides:

### ✅ **Immediate Validation Benefits:**
1. **Visible Results**: Each service produces testable XML output immediately
2. **Incremental Testing**: Features can be validated individually as they're built
3. **Faster Feedback**: XML structure issues caught during development, not integration
4. **Regression Prevention**: Working XML output prevents breaking changes
5. **User Testing**: Stakeholders can test each feature as it's completed

### 📋 **Updated Migration Checklist for Each Feature:**
```markdown
## [Feature] Migration Checklist - REVISED

### Feature Flag Integration
- [ ] Add feature flag for this component
- [ ] Integrate new implementation alongside legacy

### Preparation
- [ ] Extract interface from legacy code
- [ ] Write comprehensive tests covering existing behavior  
- [ ] Create new implementation following SOLID principles, best practices and patterns
- [ ] Verify new implementation passes all tests

### XML Integration 
- [ ] Add XML generation method to service
- [ ] Create CharacterConverterFacade integration method
- [ ] Update main parseCharacterToXML template to use new method
- [ ] Test XML output with real character data
```

### 🎯 **Revised Success Criteria:**
- **Step Completion**: Service + XML + Tests + Integration = DONE
- **No Deferred Integration**: XML generation is part of feature, not separate phase
- **Continuous Validation**: Each step produces working, testable XML
- **Immediate Value**: Users can test individual features as they're completed

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


