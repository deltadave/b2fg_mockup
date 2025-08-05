# AWS Lambda Proxy Setup Guide

## Step 1: Create Lambda Function
1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `dnd-beyond-proxy`
5. Runtime: Node.js 18.x
6. Copy the code from `aws-lambda-proxy.js`

## Step 2: Create API Gateway
1. Go to API Gateway Console
2. Choose "REST API" → Build
3. API name: `dnd-beyond-proxy-api`
4. Create API

## Step 3: Configure API Gateway Resources
1. Create resource `/character/{id}`
2. Enable CORS on the resource
3. Create GET method:
   - Integration type: Lambda Function
   - Use Lambda Proxy integration: ✓
   - Lambda Function: `dnd-beyond-proxy`

## Step 4: Deploy API
1. Actions → Deploy API
2. Stage: `prod`
3. Note the Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

## Step 5: Update JavaScript
Replace the D&D Beyond API calls in your app.js with:
```javascript
const apiUrl = "https://YOUR-API-GATEWAY-URL/prod/character/";
```

## Alternative: Direct Lambda URL (Simpler)
1. In Lambda console, go to Configuration → Function URL
2. Create function URL with CORS enabled
3. Use this URL directly in your JavaScript

## Cost Estimate
- Lambda: ~$0.20 per 1M requests
- API Gateway: ~$3.50 per 1M requests
- For typical usage: < $1/month

## Benefits
- No third-party dependencies
- Better reliability and performance
- Full control over caching and rate limiting
- Integrated with your AWS account