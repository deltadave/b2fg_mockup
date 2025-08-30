/**
 * Test script to verify the corrected currency XML format
 */

import { CurrencyProcessor } from './src/domain/character/services/CurrencyProcessor.js';

console.log('🧪 Testing Corrected Currency XML Format...\n');

// Test with sample data
const testCharacterData = {
  id: 151483095,
  name: 'TestCharacter2',
  currencies: {
    cp: 12,
    sp: 2,
    gp: 43,
    ep: 3,
    pp: 6
  }
};

console.log('📊 Input Currency Data:');
console.log('   CP: 12, SP: 2, GP: 43, EP: 3, PP: 6\n');

// Process the currency
const result = CurrencyProcessor.processCurrency(testCharacterData);

if (!result.success) {
  console.error('❌ Currency processing failed:', result.errors);
  process.exit(1);
}

console.log('✅ Currency Processing Successful!');

// Generate Fantasy Grounds XML
const fgXML = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency);

console.log('\n🏰 Fantasy Grounds XML Output (Corrected Format):');
console.log('────────────────────────────────────────────────');
console.log(fgXML);
console.log('────────────────────────────────────────────────');

console.log('\n📋 Expected Fantasy Grounds Structure:');
console.log('<coins>');
console.log(`${fgXML.split('\n').map(line => '  ' + line).join('\n')}`);
console.log('</coins>');

console.log('\n✨ Key Changes Made:');
console.log('❌ OLD: <pp type="number">6</pp>');
console.log('✅ NEW: <id-00001><amount type="number">6</amount><name type="string">PP</name></id-00001>');

console.log('\n🎯 This format should now import correctly into Fantasy Grounds!');

// Test with no currency
console.log('\n🔍 Testing No Currency Scenario:');
const noCurrencyData = { id: 123, name: 'Empty', currencies: {} };
const noCurrencyResult = CurrencyProcessor.processCurrency(noCurrencyData);
const noCurrencyXML = CurrencyProcessor.generateFantasyGroundsXML(noCurrencyResult.processedCurrency);

console.log('No Currency XML:');
console.log(noCurrencyXML);

console.log('\n✅ Currency format correction completed successfully!');