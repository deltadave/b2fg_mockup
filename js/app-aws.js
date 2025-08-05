// Modified app.js for AWS Lambda proxy
// Replace the direct D&D Beyond API calls with AWS Lambda proxy calls

// Add this configuration at the top of your app.js file:
const AWS_LAMBDA_PROXY_URL = "https://YOUR-LAMBDA-URL.execute-api.YOUR-REGION.amazonaws.com/prod/character/";

// Replace the existing fetchCharacterData function calls with this approach:

function fetchCharacterFromAWS(characterId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: AWS_LAMBDA_PROXY_URL + characterId,
            type: 'GET',
            dataType: 'json',
            timeout: 30000,
            success: function(response) {
                console.log('AWS Lambda response:', response);
                resolve(response);
            },
            error: function(xhr, status, error) {
                console.error('AWS Lambda error:', error);
                reject(new Error(`Failed to fetch character: ${error}`));
            }
        });
    });
}

// Alternative POST method if you prefer:
function fetchCharacterFromAWSPost(characterId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: AWS_LAMBDA_PROXY_URL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: characterId }),
            dataType: 'json',
            timeout: 30000,
            success: function(response) {
                console.log('AWS Lambda response:', response);
                resolve(response);
            },
            error: function(xhr, status, error) {
                console.error('AWS Lambda error:', error);
                reject(new Error(`Failed to fetch character: ${error}`));
            }
        });
    });
}

/* 
TO IMPLEMENT IN YOUR EXISTING app.js:

1. Add the AWS_LAMBDA_PROXY_URL constant at the top
2. Replace the two locations where you use:
   const url = "https://character-service.dndbeyond.com/character/v5/character/";
   
   With:
   const url = AWS_LAMBDA_PROXY_URL;
   
3. Or replace the entire AJAX call with fetchCharacterFromAWS(characterId)

The Lambda function handles the CORS and API formatting, so your existing 
response processing logic should work unchanged.
*/