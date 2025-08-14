// Global type declarations for legacy integration

declare global {
  interface Window {
    // Legacy global variables from appState.js
    startXML: string;
    allXML: string;
    pcFilename: string;
    
    // Character data tracking
    payFlag: number;
    addHP: number;
    hasAppear: number;
    object: any;
    
    // Class flags
    isArtificer: number;
    isBarbarian: number;
    isBard: number;
    isCleric: number;
    isDruid: number;
    isFighter: number;
    isMonk: number;
    isPaladin: number;
    isRanger: number;
    isRogue: number;
    isSorcerer: number;
    isWarlock: number;
    isWizard: number;
    isBloodHunter: number;
    
    // Race flags
    isDragonborn: number;
    isDwarf: number;
    isElf: number;
    isHalfling: number;
    isHalfOrc: number;
    isHalfElf: number;
    isHuman: number;
    isTiefling: number;
    isGnome: number;
    isGoliath: number;
    
    // Ability scores
    strScore: number;
    strMod: number;
    chaScore: number;
    chaMod: number;
    conScore: number;
    conMod: number;
    intScore: number;
    intMod: number;
    dexScore: number;
    dexMod: number;
    wisScore: number;
    wisMod: number;
    
    // Totals
    totalLevels: number;
    totalHP: number;
    profBonus: number;
    
    // Feature flags and DI container (future)
    FeatureFlags?: {
      isEnabled(feature: string): boolean;
      enable(feature: string): void;
      disable(feature: string): void;
    };
    
    DIContainer?: {
      resolve<T>(name: string): T;
      register<T>(name: string, implementation: new (...args: any[]) => T): void;
    };
  }
}

export {};