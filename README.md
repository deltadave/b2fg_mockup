# D&D Beyond to Fantasy Grounds Converter

A web-based utility that converts D&D Beyond character data to Fantasy Grounds XML format, enabling seamless character transfers between the two platforms.

## Overview

This tool fetches character data from D&D Beyond's API and converts it to Fantasy Grounds Unity (FGU) compatible XML format. The project is currently undergoing a complete modernization from legacy JavaScript to a TypeScript-based architecture with modern tooling.

## Features

- **Character Conversion**: Convert D&D Beyond characters to Fantasy Grounds XML format
- **Comprehensive Data Processing**: Handles ability scores, inventory, spells, class features, and racial traits
- **Fantasy Grounds Compatibility**: Generates XML compatible with Fantasy Grounds Unity
- **Client-Side Processing**: All conversion happens in the browser - no server required
- **Encumbrance Calculation**: Supports advanced encumbrance rules including Goliath Powerful Build
- **Spell Slot Management**: Accurate multiclass spell slot calculation including Warlock Pact Magic
- **Class Feature Support**: Extensive support for class-specific features and racial traits

## Quick Start

### Legacy Version (Current Production)
1. Open `legacy/index.html` in a web browser
2. Enter your D&D Beyond character ID or URL
3. Click "Convert Character"
4. Download the generated XML file
5. Import into Fantasy Grounds Unity

### Development Version (In Progress)
```bash
cd devel
npm install
npm run dev
```

## Project Structure

```
b2fg/
├── legacy/                 # Current production version
│   ├── index.html         # Main application interface
│   ├── js/                # Legacy JavaScript modules
│   │   ├── app.js         # Main application logic
│   │   ├── characterParser.js  # Core parsing (~3,286 lines)
│   │   ├── gameConstants.js    # D&D 5e rules and constants
│   │   └── utilities.js   # Utility functions
│   ├── css/               # Styling and themes
│   └── data/              # Sample character files
├── devel/                 # Modern refactored version
│   ├── src/
│   │   ├── domain/        # Business logic and models
│   │   ├── application/   # Application facades
│   │   ├── infrastructure/# Framework and external dependencies
│   │   └── presentation/  # UI components (Alpine.js)
│   ├── package.json       # Modern build configuration
│   └── vite.config.ts     # Build tool configuration
└── REFACTOR_PLAN.md       # Detailed modernization strategy
```

## Technology Stack

### Legacy (Current)
- **Frontend**: Vanilla JavaScript, jQuery
- **Styling**: Bootstrap 4, custom CSS
- **Architecture**: Monolithic client-side application

### Modern (In Development)
- **Frontend**: Alpine.js 3.x, TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite, Vitest for testing
- **Architecture**: Domain-driven design with SOLID principles

## API Integration

- **Proxy Service**: `https://uakari-indigo.fly.dev/` (bypasses CORS restrictions)
- **D&D Beyond API**: `https://character-service.dndbeyond.com/character/v5/character/`
- **Character Data**: Fetches comprehensive character JSON including classes, races, equipment, and spells

## Development

### Legacy Development
No build process required - open `legacy/index.html` directly in browser.

### Modern Development
```bash
cd devel
npm install          # Install dependencies
npm run dev          # Start development server
npm run test         # Run test suite
npm run build        # Build for production
npm run typecheck    # TypeScript type checking
```

## Testing

### Legacy
Manual testing with sample character data in `data/` directory.

### Modern
- **Unit Tests**: Vitest with comprehensive test coverage
- **Integration Tests**: End-to-end character conversion testing
- **Type Safety**: TypeScript strict mode with comprehensive type checking

## Refactoring Progress

The project is following a **Strangler Fig Pattern** migration strategy:

1. **✅ Phase 1**: Foundation setup with modern tooling
2. **🚧 Phase 2**: Feature-by-feature migration with XML integration
3. **📋 Phase 3**: UI migration to Alpine.js components

See [REFACTOR_PLAN.md](REFACTOR_PLAN.md) for detailed migration strategy and progress.

## Character Support

### Races
- Human (Standard, Variant, Custom Lineage)
- Elf (High, Wood, Drow, Eladrin)
- Dwarf (Mountain, Hill, Duergar)
- Halfling (Lightfoot, Stout, Ghostwise)
- Dragonborn, Tiefling, Gnome, Half-Elf, Half-Orc
- Goliath (with Powerful Build support)
- And many more from official D&D 5e sources

### Classes
- All PHB classes with subclass support
- Multiclass spell slot calculation
- Class-specific features and abilities
- Warlock Pact Magic handling

### Equipment
- Weapons, armor, and gear
- Magic items with proper Fantasy Grounds formatting
- Container support (Bag of Holding, etc.)
- Encumbrance calculation with racial modifiers

## Contributing

This project uses Creative Commons Attribution-ShareAlike 4.0 International License. Contributions should follow the established patterns and coding standards outlined in the refactor plan.

### Code Standards
- **TypeScript**: Strict mode with comprehensive type safety
- **Testing**: Comprehensive unit and integration test coverage
- **Architecture**: Domain-driven design following SOLID principles
- **UI**: Alpine.js components with Tailwind CSS styling

## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

You are free to:
- **Share**: Copy and redistribute the material in any medium or format
- **Adapt**: Remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution**: Give appropriate credit and indicate if changes were made
- **ShareAlike**: Distribute contributions under the same license as the original

## Support

- **Issues**: Report bugs and feature requests via GitHub issues
- **Documentation**: See [CLAUDE.md](CLAUDE.md) for development guidelines
- **Community**: Join discussions about D&D character conversion and Fantasy Grounds integration

## Changelog

### Version 2.0.0 (In Development)
- Complete TypeScript rewrite
- Modern tooling with Vite and Alpine.js
- Domain-driven architecture
- Comprehensive test suite
- Feature flag system for gradual migration

### Version 1.x (Legacy)
- Original JavaScript implementation
- jQuery-based UI
- Bootstrap styling
- Monolithic architecture