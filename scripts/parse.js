function parseCharacter(inputCharacter) {
//preamble
  switch(exportFormat) {
    case ("Classic") :
      charXML = `<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n<root version=\"3.3\" release=\"8|CoreRPG:4\">\n\t<character>\n`
      break;
    case ("Unity"):
      charXML = `<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<root version=\"4\" dataversion=\"20191121\" release=\"8|CoreRPG:4\">\n\t<character>\n`
      break;
    default:
  }
//character bio info
  charXML += `\t\t<!-- ${characterData.id} -->\n`
  charXML += `\t\t<name type=\"string\">${characterData.name}</name>\n`
  charXML += `\t\t<alignment type=\"string\">${alignmentName[characterData.alignmentId-1]}</alignment>\n`
//age
  charXML += `\t\t<age type="string">${characterData.age || ''}</age>\n`
//height
  charXML += `\t\t<height type="string">${characterData.height || ''}</height>\n`
//weight
  charXML += `\t\t<weight type="string">${characterData.weight || ''}</weight>\n`
//gender
  charXML += `\t\t<gender type="string">${characterData.gender || ''}</gender>\n`
//size
  charXML += `\t\t<size type="string">${characterData.race.size || ''}</size>\n`
//deity
  charXML += `\t\t<deity type="string">${characterData.faith || ''}</deity>\n`
//appearance
  charXML += `\t\t<appearance type="string">Hair: ${characterData.hair|| ''} Eyes: ${characterData.eyes || ''} Skin: ${characterData.skin || ''}</appearance>\n`

  for (const prop in characterData.traits) {
    if (characterData.traits[prop] != null)
    charXML += `\t\t<${prop.toLowerCase()} type="string">${characterData.traits[prop]}</${prop.toLowerCase()}>\n`
  }
  if (characterData.background.hasCustomBackground) {
    let characterBackground = characterData.background.customBackground.name
    charXML += `\t\t<background type="string">${characterBackground}</background>\n\t\t<backgroundlink type="windowreference">\n\t\t\t    <class>reference_background</class>\n\t\t\t<recordname>reference.backgrounddata.${characterBackground.toLowerCase().replace(/\W/g, '')}@*</recordname>\n\t\t</backgroundlink>`
  } else {
    let characterBackground = characterData.background.definition.name
    charXML += `\t\t<background type="string">${characterBackground}</background>\n\t\t<backgroundlink type="windowreference">\n\t\t\t    <class>reference_background</class>\n\t\t\t<recordname>reference.backgrounddata.${characterBackground.toLowerCase().replace(/\W/g, '')}@*</recordname>\n\t\t</backgroundlink>\n`
  }
  //race
  charXML += `\n\t\t<race type=\"string\">${characterData.race.fullName}</race>\n\t\t<racelink type=\"windowreference\">\n\t\t\t<class>reference_race</class>\n\t\t\t<recordname>reference.racedata.${characterData.race.baseName.toLowerCase().replace(/\W/g, '')}@*</recordname>\n\t\t</racelink>\n`
  
  let profSkills = Array(skillsList.length).fill(0) //track skills proficiencies
  
    //proficiencies may only be gained once
  let proficientSkillsList = getObjects(characterData, 'entityTypeId', '1958004211')
  
  for(const obj of proficientSkillsList) {
    let index = skillsList.indexOf(obj.friendlySubtypeName)
    if(!profSkills[index]) { 
      profSkills[index]=1
    }
  }
  //expertise - except for Expertise
  let expertiseSkillsList = getObjects(characterData, 'type', 'expertise' )
  for(const obj of expertiseSkillsList) {
    let index = skillsList.indexOf(obj.friendlySubtypeName)
    profSkills[index]++
  }
  //classes
  let classesList = getObjects(characterData, 'entityTypeId', '1446578651')
console.log(classesList)
  charXML += `\t\t<classes>\n`
  classesList.forEach(item, i) => {
    if (item.level) {
    charXML +=`\t\t\t<id-${(i+1).toString().padStart(5,'0')}>\n\t\t\t\t<hddie type="dice">d${item.definition.hitDice}</hddie>\n\t\t\t\t\t<name type="string">${item.definition.name}</name>\n
				<casterpactmagic type="number">0</casterpactmagic>
				<casterlevelinvmult type="number">1</casterlevelinvmult>
				<level type="number">6</level>
				<shortcut type="windowreference">
					<class>reference_class</class>
					<recordname>reference.classdata.druid@*</recordname>
				</shortcut>
      </id-$(i+1).toString().padStart(5,'0')>`
    }
  }

  charXML += `\t\t<classes>\n`

  //half proficiencies has to be done after classes due to bard jack of all trades
  var halfProfSkillsList = getObjects(characterData, 'type', 'half-proficiency')
  
  for(const obj of halfProfSkillsList) {
    let index = skillsList.indexOf(obj.friendlySubtypeName)
    if(!profSkills[index]) { 
      profSkills[index]=3
    }
  }

  //skills
  charXML += `\t\t<skilllist>\n`
  skillsList.forEach((item, i) => {charXML += `\t\t\t<id-${(i+1).toString().padStart(5, '0')}>\n\t\t\t<misc type="number">0</misc>\n\t\t\t\t<name type="string">${item}</name>\n\t\t\t\t<stat type="string">${skillsAbilities[i]}</stat>\n\t\t\t\t<prof type="number">${profSkills[i]}</prof>\n\t\t\t</id-${(i+1).toString().padStart(5, '0')}>\n`})
  charXML += `\t\t</skilllist>\n`
  charXML += ``
  console.log(charXML)
}

const getObjects = function(obj, key, val) {
  var objects = [];
  for (var i in obj) {
      if (!obj.hasOwnProperty(i)) continue;
      if (typeof obj[i] == 'object') {
          objects = objects.concat(getObjects(obj[i], key, val));
      } else
      if (i == key && obj[i] == val || i == key && val == '') { //
          objects.push(obj);
      } else if (obj[i] == val && key == ''){
          if (objects.lastIndexOf(obj) == -1){
              objects.push(obj);
          }
      }
  }
  return objects;
};