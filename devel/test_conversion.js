// Test script for modern character conversion
import { characterConverterFacade } from './src/application/facades/CharacterConverterFacade.js';
import { featureFlags } from './src/core/FeatureFlags.js';

console.log('🚀 Testing Modern Character Conversion');
console.log('=======================================');

// Test character ID from legacy data (Willem)
const testCharacterId = '27203070';

async function testConversion() {
    try {
        console.log(`📋 Testing conversion of character ID: ${testCharacterId}`);
        console.log(`🏃 Feature flags enabled: ${Object.keys(featureFlags.getAllFlags()).filter(key => featureFlags.isEnabled(key)).length}`);
        
        // Enable debug mode for detailed output
        featureFlags.enable('debug_character_data');
        featureFlags.enable('performance_metrics');
        
        console.log('\n🔄 Starting conversion...');
        
        // Set up progress callback
        characterConverterFacade.onProgress = (step, percentage) => {
            console.log(`  📊 ${percentage}% - ${step}`);
        };
        
        const result = await characterConverterFacade.convertFromDNDBeyond(testCharacterId);
        
        console.log('\n🎯 Conversion Results:');
        console.log('====================');
        console.log(`✅ Success: ${result.success}`);
        
        if (result.success) {
            console.log(`📝 Character: ${result.characterData?.name || 'Unknown'}`);
            console.log(`📊 XML Length: ${result.xml?.length || 0} characters`);
            console.log(`⏱️  Performance:`, result.performance);
            
            // Show first part of XML
            if (result.xml) {
                console.log('\n📄 XML Preview (first 300 chars):');
                console.log('================================');
                console.log(result.xml.substring(0, 300) + '...');
                
                // Check for key XML elements
                const xmlChecks = {
                    'Character root': result.xml.includes('<character>'),
                    'Abilities section': result.xml.includes('<abilities>'),
                    'Skills section': result.xml.includes('<skilllist>'),
                    'Inventory section': result.xml.includes('<inventorylist>'),
                    'Spell slots': result.xml.includes('<spellslots') || result.xml.includes('<pactmagicslots'),
                    'Features': result.xml.includes('<featlist>'),
                    'Character name': result.xml.includes('<name type="string">'),
                };
                
                console.log('\n🔍 XML Structure Validation:');
                console.log('============================');
                Object.entries(xmlChecks).forEach(([check, passed]) => {
                    console.log(`${passed ? '✅' : '❌'} ${check}`);
                });
                
                // Calculate success rate
                const passedChecks = Object.values(xmlChecks).filter(Boolean).length;
                const totalChecks = Object.keys(xmlChecks).length;
                console.log(`\n📈 Structure Coverage: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
            }
            
        } else {
            console.log(`❌ Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('\n💥 Test failed with exception:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testConversion().then(() => {
    console.log('\n🏁 Test completed');
}).catch(error => {
    console.error('🚨 Test runner failed:', error);
});