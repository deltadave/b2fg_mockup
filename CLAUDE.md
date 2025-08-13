# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based D&D Beyond to Fantasy Grounds character converter. It's a client-side JavaScript application that fetches character data from D&D Beyond's API and converts it to Fantasy Grounds XML format.

## Development Commands

Since this is a client-side web application, there are no build commands. Development is done by:
- Opening `index.html` directly in a browser for testing
- Serving files through a local web server for CORS testing
- No package manager or build system is used

## Architecture

The codebase follows a modular JavaScript architecture with clear separation of concerns:

### Core Module Structure
- **app.js** - Main application entry point and UI event handlers
- **characterParser.js** - Core character parsing logic (~3,286 lines), converts D&D Beyond JSON to Fantasy Grounds XML
- **appState.js** - Global application state management (character flags, level tracking, spell slots, etc.)
- **gameConstants.js** - D&D 5e game rules constants (ability scores, skills, weapons, armor, class data)
- **utilities.js** - Utility functions for data traversal, string manipulation, performance monitoring
- **xmlTemplates.js** - XML template strings for D&D class features organized by class
- **uiHelpers.js** - UI utility functions
- **spellSlots.js** - Spell slot calculation logic

### Key Components
- **Character Data Flow**: D&D Beyond API → parseCharacter() → Fantasy Grounds XML
- **State Management**: Centralized in appState.js with class/race flags, level tracking, equipment state
- **Performance Monitoring**: Built-in timing utilities in utilities.js for optimization
- **Security**: Input validation and sanitization for character IDs and user data

### Data Processing
- Uses recursive object traversal (`getObjects()`) to parse D&D Beyond's complex nested JSON
- Caching system in characterParser.js to optimize repeated data lookups
- Extensive class/race/feat detection logic to generate appropriate Fantasy Grounds features

## API Integration

- **Proxy Service**: Uses `https://uakari-indigo.fly.dev/` to bypass CORS restrictions
- **D&D Beyond API**: `https://character-service.dndbeyond.com/character/v5/character/`
- **Character ID Validation**: Sanitizes and validates character IDs from URLs

## File Structure

- `index.html` - Main modern UI interface
- `js/` - All JavaScript modules
- `css/` - Styling (Bootstrap + custom CSS)
- `data/` - Sample character files for testing (JSON and XML formats)
- `images/` - Static assets

## Testing

No automated testing framework. Manual testing involves:
1. Using sample character data in `data/` directory
2. Testing with live D&D Beyond character IDs
3. Validating generated XML in Fantasy Grounds

## Legacy Code

The codebase has been modernized from a monolithic structure to modular ES6. Some legacy patterns remain but the architecture is now maintainable with clear module boundaries.