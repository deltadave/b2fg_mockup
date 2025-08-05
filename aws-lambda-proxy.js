// AWS Lambda function for D&D Beyond API proxy
// This replaces the need for third-party CORS proxy services

const https = require('https');

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Handle preflight CORS requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: ''
        };
    }
    
    try {
        // Extract character ID from the request
        let characterId;
        
        if (event.httpMethod === 'GET') {
            characterId = event.pathParameters?.id || event.queryStringParameters?.id;
        } else if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            characterId = body.id || body.characterId;
        }
        
        if (!characterId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Character ID is required' })
            };
        }
        
        // Make request to D&D Beyond v5 API
        const dndBeyondUrl = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
        
        const response = await makeHttpsRequest(dndBeyondUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Failed to fetch character data',
                details: error.message 
            })
        };
    }
};

function makeHttpsRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(new Error(`Failed to parse JSON: ${parseError.message}`));
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}