debug = true
characterID = 0
charFmt = ''
charURL = ''
const outputElement = document.getElementById("characterXMLData")
const proxyurl = "https://cors-anywhere.herokuapp.com/";

function characterTypeButton() {
  document.getElementById("exportCharType").innerHTML = `
    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Format</button>
    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
      <a class="dropdown-item" href="#">Classic</a>
      <a class="dropdown-item" href="#">Unity</a>
    </div>
  `
}

characterTypeButton()

let characterJSON;

const removeEmpty = (obj) => {
  Object.keys(obj).forEach(k =>
      (obj[k] && typeof obj[k] === 'object') && removeEmpty(obj[k]) ||
      //(obj[k] && obj[k] instanceof Array && !obj[k].length) && removeEmpty(obj[k]) ||
      (!obj[k] && obj[k] !== undefined) && delete obj[k]
  )
  for(let prop in obj) {
    if (prop && obj[prop] instanceof Array && !obj[prop].length) {
      delete obj[prop]
    }
  }
  return obj;
}

const showCharacter =  (obj) => {
  for (let prop in obj ) {
      console.log(prop)
      console.log(obj[prop])
  }
}

var myHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'mode': 'no-cors'
});

function logResult(result) {
  console.log(result)
}

function logError(result) {
  console.log("Looks like there was a problem: \n", error)
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

$(function(){ //update button value to selection and call
  $(".dropdown-menu a").click( async () => {
    $("dropdown-menu a.btn:first-child").text($(this).text())
    $("dropdown-menu a.btn:first-child").val($(this).text())
    characterID = $("#charID").val()
    charFmt = $(this).text()

    debugSettings()
    characterJSON = await fetchJSON(proxyurl+charURL)
    removeEmpty(characterJSON)
    showCharacter(characterJSON)
    /*

    fetch(proxyurl + charURL)
      .then(function(resp) {
         return resp.json()
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


        //let y = document.createTextNode("characterJSON.valueOf()")
        //outputElement.appendChild(y)
        const myRequest = new Request( charURL, {
          method: 'GET',
          headers: myHeaders,
          mode: 'no-cors',
          cache: 'default',
        });

    characterJSON = fetchJSON(charURL)
    console.log(characterJSON)
    removeEmpty(characterJSON)
    showCharacter(characterJSON)

            /*
            then(function (response) {
              if (!response.ok) {
                console.log('Error: ', response)
              }
              return response.json();
            })
                .then(function (json) {
                  document.write(json.value)
                })
                .catch(function (error) {
                  var p = document.createElement('p')
                  p.appendChild(
                      document.createTextNode('Error: ' + error.message)
                  )
                  document.body.insertBefore(p, outputElement)
                })
             */

  });
});