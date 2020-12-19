let debug = true
let characterID = 0
let exportFormat = ''
let charURL = ''
let characterJSON;
const outputElement = document.getElementById("characterXMLData")
const proxyURL = "https://cors-anywhere.herokuapp.com/";

function characterTypeButton() {
  document.getElementById("exportCharType").innerHTML = `
    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Format</button>
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

function fetchJSON(resourceURL) {
  fetch(resourceURL)
      .then(validateResponse)
      .then(readResponseAsJSON)
      .then(logResult)
      .catch(logError)
}

function debugSettings(){
  if (!debug) {
    charURL = `https://www.dndbeyond.com/character/${characterID}/json`
  } else {
    charURL = `https://raw.githubusercontent.com/deltadave/DandD_Beyond-2-FantasyGrounds/master/data/xerseris.json`
  }
  console.log(`pulling from ${charURL}`)
}

characterTypeButton()

const formatButton = document.querySelector(".dropdown-menu a")

formatButton.addEventListener('click', e =>{
  exportFormat = e.toElement.innerText
  characterID = document.getElementById("charID").value
  document.getElementById("dropdownMenuButton").innerText = exportFormat
  console.log(e)
  console.log(exportFormat)
  console.log(characterID)
})

/*    .click( async () => {
    $("dropdown-menu a.btn:first-child").text($(this).text())
    $("dropdown-menu a.btn:first-child").val($(this).text())
    characterID = $("#charID").val()
    charFmt = $(this).text()

    debugSettings()

    fetch(proxyurl + charURL)
      .then(function(response) {
         return response.json()
      })
      .then(function(data) {
         console.log(data)
         characterJSON = data
         removeEmpty(characterJSON)
         showCharacter(characterJSON)
      })
      .catch(function(error) {
         console.log('Looks like there was a problem: \n', error);
      })
*/

