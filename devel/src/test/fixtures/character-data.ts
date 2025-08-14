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