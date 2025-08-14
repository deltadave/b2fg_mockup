# Game Configuration Files

This directory contains JSON configuration files for D&D 5e game data. These files allow you to easily modify game rules, alignments, and other constants without changing code files.

## Configuration Files

### `dnd5e/alignments.json`
Maps D&D Beyond alignment IDs to alignment names.

**Example:**
```json
{
  "mappings": {
    "1": "Lawful Good",
    "5": "True Neutral"
  },
  "default": "True Neutral"
}
```

### `dnd5e/abilities.json`
Defines the six core ability scores and their properties.

**Example:**
```json
{
  "abilities": [
    {
      "id": 1,
      "name": "strength",
      "displayName": "Strength",
      "abbreviation": "STR"
    }
  ],
  "calculations": {
    "defaultScore": 10
  }
}
```

### `dnd5e/currencies.json`
Standard D&D 5e currency denominations with conversion rates.

**Example:**
```json
{
  "currencies": [
    {
      "name": "GP",
      "displayName": "Gold Pieces",
      "value": 1
    }
  ]
}
```

### `dnd5e/game-rules.json`
Core mechanical rules and calculations.

**Example:**
```json
{
  "proficiencyBonus": {
    "formula": "Math.ceil(level / 4) + 1"
  },
  "armorClass": {
    "baseAC": 10
  }
}
```

## How to Modify

1. **Edit the JSON files** directly in your text editor
2. **Refresh the page** - configurations are loaded on page load
3. **No code changes required** - the system automatically uses the updated values

## Usage in Code

The configurations are loaded via the `GameConfigService`:

```typescript
import { gameConfigService } from '@/shared/services/GameConfigService';

// Get alignment name
const alignment = gameConfigService.getAlignmentName(6); // "Chaotic Neutral"

// Get abilities
const abilities = gameConfigService.getAbilities();

// Calculate proficiency bonus
const profBonus = gameConfigService.calculateProficiencyBonus(5); // 3
```

## Fallback Behavior

If configuration files fail to load, the system will:
1. Log a warning to the console
2. Use hardcoded fallback values
3. Continue functioning normally

This ensures the application remains stable even if configuration files are missing or malformed.

## Adding New Configurations

To add new configuration files:

1. Create the JSON file in the appropriate subdirectory
2. Define the TypeScript interface in `GameConfigService.ts`
3. Add loading logic to the service
4. Update this README with documentation

## File Format Requirements

- **Valid JSON** - Files must be properly formatted JSON
- **UTF-8 encoding** - Use UTF-8 encoding for proper character support
- **No comments** - JSON doesn't support comments (use "notes" fields instead)
- **Consistent structure** - Follow the established patterns shown above