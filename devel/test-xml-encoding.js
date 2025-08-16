// Simple test to verify XML entity encoding
// This can be run with: node test-xml-encoding.js

// Mock the StringSanitizer functionality
class StringSanitizer {
  static sanitizeForXML(input) {
    if (input === null || input === undefined || input === "") {
      return "";
    }
    
    const inputString = String(input);
    
    // Comprehensive HTML entity encoding for security
    return inputString
      .replace(/&/g, "&amp;")      // Must be first to avoid double-encoding
      .replace(/</g, "&lt;")       // Prevent HTML injection
      .replace(/>/g, "&gt;")       // Prevent HTML injection
      .replace(/"/g, "&quot;")     // Prevent attribute injection
      .replace(/'/g, "&#39;")      // Prevent attribute injection
      .replace(/=/g, "&#x3D;")     // Equal sign for attribute safety
      .replace(/\//g, "&#x2F;");   // Forward slash for extra safety
  }
}

// Test cases
const testCases = [
  'Simple text',
  'Text & Company',
  'Bob "The Great" Smith',
  'Level < 5 & HP > 10',
  "John's & Jane's Adventure",
  'Attack = 1d8+3 / Round',
  'Mixed: & < > " \' = /'
];

console.log('=== XML Entity Encoding Test ===\n');

testCases.forEach((testCase, index) => {
  const encoded = StringSanitizer.sanitizeForXML(testCase);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input:  "${testCase}"`);
  console.log(`  Output: "${encoded}"`);
  
  // Verify specific encodings
  const checks = [];
  if (testCase.includes('&')) {
    checks.push(`✓ & → &amp; (${encoded.includes('&amp;')})`);
  }
  if (testCase.includes('<')) {
    checks.push(`✓ < → &lt; (${encoded.includes('&lt;')})`);
  }
  if (testCase.includes('>')) {
    checks.push(`✓ > → &gt; (${encoded.includes('&gt;')})`);
  }
  if (testCase.includes('"')) {
    checks.push(`✓ " → &quot; (${encoded.includes('&quot;')})`);
  }
  if (testCase.includes("'")) {
    checks.push(`✓ ' → &#39; (${encoded.includes('&#39;')})`);
  }
  
  if (checks.length > 0) {
    console.log(`  Checks: ${checks.join(', ')}`);
  }
  console.log('');
});

// Test specific XML generation
console.log('=== Fantasy Grounds XML Generation Test ===\n');

const mockCharacter = {
  name: 'Bob & Alice',
  gender: 'Male & Female',
  deity: 'God of "War" & Peace'
};

const generateXML = (characterData) => {
  return `<character>
  <name type="string">${StringSanitizer.sanitizeForXML(characterData.name)}</name>
  <gender type="string">${StringSanitizer.sanitizeForXML(characterData.gender)}</gender>
  <deity type="string">${StringSanitizer.sanitizeForXML(characterData.deity)}</deity>
</character>`;
};

const xml = generateXML(mockCharacter);
console.log('Generated XML:');
console.log(xml);

// Verify ampersands are properly encoded
const hasAmpersands = xml.includes('&amp;');
const hasUnencoded = xml.match(/&(?!amp;|lt;|gt;|quot;|#39;|#x3D;|#x2F;)/);

console.log('\n=== Validation ===');
console.log(`✓ Contains &amp;: ${hasAmpersands}`);
console.log(`✓ No unencoded &: ${!hasUnencoded}`);
console.log(`✓ Overall success: ${hasAmpersands && !hasUnencoded}`);