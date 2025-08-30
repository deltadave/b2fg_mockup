/**
 * Quick test script to verify the currency implementation works with real data
 */

import { CurrencyProcessor } from './src/domain/character/services/CurrencyProcessor.js';
import fs from 'fs';

console.log('🧪 Testing Currency Implementation with TestCharacter2 data...\n');

// Load the test character data
const testCharacterPath = '../legacy/data/TestCharacter2_151483095_v05.json';
let testCharacterData;

try {
  const rawData = fs.readFileSync(testCharacterPath, 'utf8');
  const apiResponse = JSON.parse(rawData);
  testCharacterData = apiResponse.data; // Extract character data from API wrapper
} catch (error) {
  console.error('❌ Failed to load test character data:', error.message);
  process.exit(1);
}

console.log('📊 Original Currency Data:');
console.log(JSON.stringify(testCharacterData.currencies, null, 2));
console.log();

// Process the currency
const result = CurrencyProcessor.processCurrency(testCharacterData);

if (!result.success) {
  console.error('❌ Currency processing failed:', result.errors);
  process.exit(1);
}

console.log('✅ Currency Processing Successful!');
console.log('💰 Processed Currency Data:');
console.log(`   PP: ${result.processedCurrency.originalAmounts.pp}`);
console.log(`   GP: ${result.processedCurrency.originalAmounts.gp}`);
console.log(`   EP: ${result.processedCurrency.originalAmounts.ep}`);
console.log(`   SP: ${result.processedCurrency.originalAmounts.sp}`);
console.log(`   CP: ${result.processedCurrency.originalAmounts.cp}`);
console.log();

console.log('💎 Total Values:');
console.log(`   Gold Value: ${result.processedCurrency.totalGoldValue} GP`);
console.log(`   Copper Value: ${result.processedCurrency.totalCopperValue} CP`);
console.log(`   Has Currency: ${result.processedCurrency.hasAnyCurrency}`);
console.log();

// Test Fantasy Grounds XML generation
console.log('🏰 Fantasy Grounds XML Output:');
const fgXML = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency);
console.log(fgXML);
console.log();

// Test Foundry VTT JSON generation
console.log('🎲 Foundry VTT JSON Output:');
const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency);
console.log(JSON.stringify(foundryData, null, 2));
console.log();

if (result.warnings && result.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  result.warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log();
}

console.log('🎉 Currency implementation test completed successfully!');
console.log();
console.log('📈 Expected Fantasy Grounds XML in full character export:');
console.log('   <coins>');
console.log(`     ${fgXML.replace(/\n/g, '\n     ')}`);
console.log('   </coins>');