let debug = true
let characterID = 0
let exportFormat = ''
let charURL = ''
let characterData;
const outputElement = document.getElementById("characterXMLData")
const proxyURL = "https://cors-anywhere.herokuapp.com/";

function characterTypeButton() {
  document.getElementById("exportCharType").innerHTML = `
    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownCharTypeButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Format</button>
    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
      <a class="dropdown-item" href="#">Classic</a>
      <a class="dropdown-item" href="#">Unity</a>
    </div>
  `
}

function removeEmpty(obj) {
  Object.keys(obj).forEach(k =>
      (obj[k] && typeof obj[k] === 'object') && removeEmpty(obj[k]) ||
      //(obj[k] && obj[k] instanceof Array && !obj[k].length) && removeEmpty(obj[k]) ||
      (!obj[k] && obj[k] !== undefined) && delete obj[k]
  )
  for(let prop in obj) {
    if (obj.hasOwnProperty(prop) && obj[prop] instanceof Array && !obj[prop].length) {
      delete obj[prop]
    }
  }
  return obj;
}

function showCharacter(obj) {
  for (let prop in obj ) {
    console.log(prop + ": ")
    console.log(obj[prop])
  }
}

var myHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'mode': 'no-cors'
});

function logResult(response) {
  console.log(response)
}

function logError(response) {
  console.log("Looks like there was a problem: \n", response)
}

function validateResponse(response) {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}

function readResponseAsJSON(response) {
  return response.json()
}

async function fetchJSON(resourceURL) {
  return (await fetch(resourceURL)).json()
}

function debugSettings(){
  if (!debug) {
    charURL = `${proxyURL}https://www.dndbeyond.com/character/${characterID}/json`
  } else {
    //charURL=`data/xyrseris.json`
    //charURL=`data/vinster.json`
    charURL=`data/willem.json`
    //charURL = `${proxyURL}https://raw.githubusercontent.com/deltadave/DandD_Beyond-2-FantasyGrounds/master/data/xyrseris.json`
  }
  console.log(`pulling from ${charURL}`)
}

characterTypeButton()

const formatButton = document.querySelector(".dropdown-menu")

formatButton.addEventListener('click', async e =>{
  exportFormat = e.toElement.innerText
  characterID = document.getElementById("charID").value
  document.getElementById("dropdownCharTypeButton").innerText = exportFormat
  console.log(e)
  console.log(exportFormat)
  console.log(characterID)
  debugSettings()
  try {
    characterData = await fetchJSON(charURL)
  } catch (err) {
    alertMsg =`error! Either that character ID doesn't exist or it's not public`
    console.log(`${alertMsg}. ${err}`)
  } 
  console.log("Button Response:")
  console.log(characterData)
  console.log("Parsing Character")
  parseCharacter(characterData)  
})

/*
*/

