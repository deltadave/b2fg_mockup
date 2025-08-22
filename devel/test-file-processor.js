// Simple test script for FileProcessor
// Run in browser console to test file processing functionality

console.log('🧪 Testing FileProcessor...');

// Create a test file from our test character data
async function testFileProcessor() {
  try {
    // Read the test character JSON
    const response = await fetch('/test-character.json');
    const jsonContent = await response.text();
    
    // Create a File object from the JSON content
    const testFile = new File([jsonContent], 'test-character.json', {
      type: 'application/json'
    });
    
    console.log('📁 Created test file:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Import and use the FileProcessor
    const { fileProcessor } = await import('./src/domain/input/services/FileProcessor.ts');
    
    console.log('⚡ Processing file...');
    const result = await fileProcessor.processFile(testFile);
    
    console.log('✅ File processing result:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS: Character data processed successfully');
      console.log('Character Name:', result.characterData?.name);
      console.log('Source Type:', result.sourceType);
      console.log('Filename:', result.filename);
      
      if (result.warnings?.length > 0) {
        console.warn('⚠️ Warnings:', result.warnings);
      }
    } else {
      console.error('❌ FAILURE: File processing failed');
      console.error('Errors:', result.errors);
    }
    
    return result;
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error);
    throw error;
  }
}

// Security test - malicious file
async function testMaliciousFile() {
  try {
    console.log('🛡️ Testing security validation...');
    
    const maliciousContent = JSON.stringify({
      "id": 123,
      "name": "<script>alert('xss')</script>",
      "__proto__": { "polluted": true },
      "javascript:": "malicious://content",
      "classes": Array(2000).fill({ name: "test" }) // Array bomb
    });
    
    const maliciousFile = new File([maliciousContent], 'malicious.json', {
      type: 'application/json'
    });
    
    const { fileProcessor } = await import('./src/domain/input/services/FileProcessor.ts');
    const result = await fileProcessor.processFile(maliciousFile);
    
    console.log('🛡️ Security test result:', result);
    
    if (!result.success) {
      console.log('✅ Security validation working - malicious content blocked');
      console.log('Threats detected:', result.errors);
    } else {
      console.warn('⚠️ Security concern - malicious content processed');
    }
    
    return result;
    
  } catch (error) {
    console.log('✅ Security validation working - processing failed safely:', error.message);
  }
}

// Run tests
console.log('Running FileProcessor tests...');
testFileProcessor().then(() => {
  console.log('🧪 Basic test complete');
  return testMaliciousFile();
}).then(() => {
  console.log('🧪 Security test complete');
}).catch(error => {
  console.error('🚨 Test suite failed:', error);
});