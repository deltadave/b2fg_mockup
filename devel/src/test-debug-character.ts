/**
 * Debug script to test real TestCharacter2 data with WeaponListGenerator
 */

import { WeaponListGenerator } from './domain/export/generators/WeaponListGenerator';
import fs from 'fs';

// Load TestCharacter2
const rawData = JSON.parse(fs.readFileSync('../legacy/data/TestCharacter2_151483095_v05.json', 'utf8'));
const testCharacterData = rawData.data; // Extract the actual character data

console.log('=== DEBUG TESTCHARACTER2 WEAPONS ===');
console.log('Character stats:', testCharacterData.stats);

// Extract just the weapons to analyze
const weapons = testCharacterData.inventory
  ?.filter((item: any) => item.definition.filterType === 'Weapon')
  .slice(0, 5); // First 5 weapons

console.log('\nFound weapons:', weapons?.map((w: any) => w.definition.name));

// Create generator and test
const generator = new WeaponListGenerator();
const result = generator.generateWeaponListXML(testCharacterData);

console.log('\n=== GENERATED XML ===');
console.log(result);

// Check for all damage bonus values
const damageMatches = result.match(/<bonus type="number">(\d+)<\/bonus>/g);
console.log('\n=== DAMAGE BONUSES FOUND ===');
console.log(damageMatches);

export {};