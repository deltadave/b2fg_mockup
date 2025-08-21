# D&D Beyond to Fantasy Grounds Converter - Tech Stack

This project is a client-side web application that converts D&D Beyond character data to Fantasy Grounds XML format.

## Frontend

### Core Framework
- **Vanilla TypeScript** - Modern ES6+ with strict type checking
- **Alpine.js** - Lightweight reactive framework for UI components
- **Vite** - Modern build tool with HMR and optimized bundling
- **Legacy Browser Support** - Via @vitejs/plugin-legacy for broader compatibility

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing with autoprefixer
- **Custom Design System** - D&D-themed color palette (gold: #D4AF37, red: #8B1538)
- **Google Fonts** - Cinzel (serif) and Inter (sans-serif) font families
- **Font Awesome** - Icon library for UI elements

### Data Flow & State Management
- **Alpine.js Stores** - Reactive state management for UI components
- **Facade Pattern** - CharacterConverterFacade for unified data processing
- **Domain-Driven Design** - Clear separation of concerns with TypeScript interfaces

### Character Data Processing
- **D&D Beyond API Integration** - Via CORS proxy (uakari-indigo.fly.dev)
- **Character Data Models** - TypeScript interfaces for type safety
- **Feature Processors** - Modular processors for abilities, inventory, spells, features
- **Spell Slot Calculator** - Multi-class spell slot calculation
- **Encumbrance Calculator** - D&D 5e carrying capacity rules

### Networking & APIs
- **Fetch API** - Modern HTTP requests
- **CORS Proxy** - Third-party proxy for D&D Beyond API access
- **AWS Lambda** - Serverless contact form backend

### Data Validation & Security
- **Input Sanitization** - StringSanitizer utility for user inputs
- **Character ID Validation** - Secure validation of D&D Beyond character IDs
- **Safe Data Access** - SafeAccess utility for nested object traversal

### Testing & Quality
- **Vitest** - Unit testing framework with TypeScript support
- **@vitest/ui** - Web-based test runner interface
- **JSDOM** - DOM testing environment
- **TypeScript Compiler** - Type checking and validation
- **Prettier** - Code formatting

### Build & Development
- **Vite Dev Server** - Hot module replacement and fast rebuilds
- **Multi-page Application** - Multiple HTML entry points (index, about, contact, donate)
- **Path Aliases** - `@/` alias for clean imports
- **CSS Processing** - PostCSS with Tailwind CSS
- **Legacy Support** - Transpilation for older browsers

### Performance & Optimization
- **Object Caching** - Cached recursive searches for performance
- **Performance Monitoring** - Built-in timing utilities
- **Code Splitting** - Automatic chunking via Vite
- **Asset Optimization** - Minification and compression
- **Tree Shaking** - Dead code elimination

## Backend & Infrastructure

### Contact Form
- **AWS Lambda** - Serverless function for contact form processing
- **HTTPS Endpoints** - Secure form submission

### Static Hosting
- **Client-Side Application** - No server-side rendering required
- **AWS S3 Compatible** - Static asset hosting ready
- **CDN Ready** - Optimized for content delivery networks

### Data Sources
- **D&D Beyond API** - Primary character data source
- **Game Configuration** - JSON-based game rules and constants
- **Static Assets** - Images, icons, and QR codes for donations

## Development Tools

### Code Quality
- **ESLint** - TypeScript-aware linting (configured but temporarily disabled)
- **Prettier** - Consistent code formatting
- **TypeScript** - Strict type checking with `--noEmit`

### Package Management
- **npm** - Dependency management
- **ES Modules** - Modern module system
- **Dev Dependencies** - Clear separation of build vs runtime dependencies

### Version Control
- **Git** - Source control with feature branching
- **GitHub** - Repository hosting

## Architecture Patterns

### Design Patterns
- **Facade Pattern** - CharacterConverterFacade simplifies complex operations
- **Strategy Pattern** - Multiple output formatters (Fantasy Grounds, planned: Foundry VTT)
- **Observer Pattern** - Alpine.js reactive state management
- **Module Pattern** - Clear separation of domain logic

### Code Organization
- **Domain-Driven Design** - Business logic separated by domain
- **Utility Libraries** - Reusable utilities for common operations
- **Type Safety** - Comprehensive TypeScript interfaces
- **Separation of Concerns** - Clear boundaries between UI, business logic, and data access

## Legacy Integration

### Gradual Migration
- **Strangler Fig Pattern** - Gradual replacement of legacy code
- **Feature Flags** - FeatureFlags system for controlled rollouts
- **Dual Architecture** - Modern TypeScript alongside legacy JavaScript
- **Backwards Compatibility** - Maintained legacy functionality during migration

This tech stack emphasizes modern web development practices while maintaining simplicity and focusing on the core functionality of character conversion.