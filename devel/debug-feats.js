// Debug feats data structure for character 151483095
console.log('📜 DEBUGGING: Feats Data Structure');
console.log('=================================');

async function debugFeats() {
  try {
    console.log('\n📡 Fetching Character Data...');
    const response = await fetch('https://uakari-indigo.fly.dev/https://character-service.dndbeyond.com/character/v5/character/151483095', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.dndbeyond.com'
      }
    });
    
    const apiResponse = await response.json();
    const characterData = apiResponse.data;
    
    console.log('✅ Character fetched:', characterData.name);
    console.log('Classes:', characterData.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', '));
    
    console.log('\n🔍 Feats Data Analysis:');
    console.log('-----------------------');
    
    // Check for feats in various locations
    console.log('📊 Potential Feat Data Properties:');
    console.log('  characterData.feats:', characterData.feats ? `${characterData.feats.length} items` : 'undefined');
    console.log('  characterData.choices?.feat:', characterData.choices?.feat ? `${characterData.choices.feat.length} items` : 'undefined'); 
    console.log('  characterData.options?.feat:', characterData.options?.feat ? `${characterData.options.feat.length} items` : 'undefined');
    console.log('  characterData.choices?.background:', characterData.choices?.background ? `${characterData.choices.background.length} items` : 'undefined');
    console.log('  characterData.choices?.race:', characterData.choices?.race ? `${characterData.choices.race.length} items` : 'undefined');
    console.log('  characterData.optionalClassFeatures:', characterData.optionalClassFeatures ? `${characterData.optionalClassFeatures.length} items` : 'undefined');
    console.log('  characterData.optionalRaceFeatures:', characterData.optionalRaceFeatures ? `${characterData.optionalRaceFeatures.length} items` : 'undefined');
    
    // Examine feats if they exist
    if (characterData.feats && characterData.feats.length > 0) {
      console.log('\n📜 Direct Feats Data:');
      characterData.feats.forEach((feat, index) => {
        console.log(`  ${index + 1}. ${feat.definition?.name || 'Unnamed feat'}`);
        console.log(`     Description: ${feat.definition?.description ? feat.definition.description.substring(0, 100) + '...' : 'No description'}`);
        console.log(`     Source: ${feat.definition?.sourceBook || 'Unknown'}`);
        console.log(`     Component ID: ${feat.componentId || 'N/A'}`);
        console.log(`     Component Type: ${feat.componentTypeId || 'N/A'}`);
      });
    }
    
    // Check feat choices
    if (characterData.choices?.feat && characterData.choices.feat.length > 0) {
      console.log('\n🎯 Feat Choices:');
      characterData.choices.feat.forEach((choice, index) => {
        console.log(`  ${index + 1}. Choice ID: ${choice.id}`);
        console.log(`     Type: ${choice.type}`);
        console.log(`     Option: ${choice.option?.name || 'No name'}`);
        console.log(`     Definition: ${choice.definition?.name || 'No definition'}`);
      });
    }
    
    // Check optional class features (might include feat-like features)
    if (characterData.optionalClassFeatures && characterData.optionalClassFeatures.length > 0) {
      console.log('\n⚡ Optional Class Features:');
      characterData.optionalClassFeatures.slice(0, 5).forEach((feature, index) => {
        console.log(`  ${index + 1}. ${feature.definition?.name || 'Unnamed feature'}`);
        console.log(`     Class: ${feature.classId || 'Unknown'}`);
        console.log(`     Required Level: ${feature.requiredLevel || 'N/A'}`);
      });
      if (characterData.optionalClassFeatures.length > 5) {
        console.log(`  ... and ${characterData.optionalClassFeatures.length - 5} more`);
      }
    }
    
    // Look for feat-related modifiers
    console.log('\n🔧 Feat-related Modifiers:');
    let featModifiers = [];
    if (characterData.modifiers) {
      Object.entries(characterData.modifiers).forEach(([source, modifiers]) => {
        modifiers.forEach(mod => {
          if (source.includes('feat') || mod.friendlyTypeName?.includes('Feat') || mod.componentTypeId === 1088085227) {
            featModifiers.push({
              source: source,
              type: mod.type,
              subType: mod.subType,
              friendlyName: mod.friendlyTypeName,
              value: mod.value,
              componentTypeId: mod.componentTypeId
            });
          }
        });
      });
    }
    
    if (featModifiers.length > 0) {
      console.log('Found feat-related modifiers:');
      featModifiers.forEach((mod, index) => {
        console.log(`  ${index + 1}. Source: ${mod.source}`);
        console.log(`     Type: ${mod.type}, SubType: ${mod.subType}`);
        console.log(`     Name: ${mod.friendlyName || 'No name'}`);
        console.log(`     Value: ${mod.value || 'N/A'}`);
      });
    } else {
      console.log('No feat-related modifiers found');
    }
    
    console.log('\n🎯 Expected Fantasy Grounds XML Structure:');
    console.log('------------------------------------------');
    console.log('Fantasy Grounds feats should look like:');
    console.log(`<featlist>
      <id-00001>
        <locked type="number">1</locked>
        <name type="string">Alert</name>
        <source type="string">Player's Handbook</source>
        <text type="formattedtext">
          <p>Always on the lookout for danger, you gain the following benefits:</p>
          <p>• You gain a +5 bonus to initiative.</p>
          <p>• You can't be surprised while you are conscious.</p>
          <p>• Other creatures don't gain advantage on attack rolls against you as a result of being unseen by you.</p>
        </text>
      </id-00001>
    </featlist>`);
    
    console.log('\n📊 Summary:');
    console.log('-----------');
    console.log(`Character ${characterData.name} (${characterData.id}):`);
    console.log(`- Direct feats: ${characterData.feats?.length || 0}`);
    console.log(`- Feat choices: ${characterData.choices?.feat?.length || 0}`);
    console.log(`- Feat modifiers: ${featModifiers.length}`);
    console.log(`- Optional features: ${characterData.optionalClassFeatures?.length || 0}`);
    
    return {
      characterName: characterData.name,
      featsCount: characterData.feats?.length || 0,
      featChoicesCount: characterData.choices?.feat?.length || 0,
      featModifiersCount: featModifiers.length,
      optionalFeaturesCount: characterData.optionalClassFeatures?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Feats debug failed:', error.message);
    return null;
  }
}

debugFeats();