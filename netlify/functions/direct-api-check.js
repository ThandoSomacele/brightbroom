// netlify/functions/direct-api-check.js
/**
 * This function helps debug API connectivity issues between Netlify functions and your SvelteKit API
 * Deploy this as a separate Netlify function to test various API endpoints
 */
exports.handler = async (event, context) => {
  const { default: fetch } = await import('node-fetch');
  
  // Define base URLs to test
  const baseUrls = [
    process.env.URL || process.env.DEPLOY_URL || "https://brightbroom.com",
    "https://brightbroom.com",
    (process.env.URL || process.env.DEPLOY_URL || "https://brightbroom.com") + "/.netlify/functions/handler",
  ];
  
  // Endpoints to test
  const endpoints = [
    "/api/payments/direct-email",
    "/api/bookings/execute-webhook",
    "/api/payments/ipn-test"
  ];
  
  const results = {};
  
  // Test each combination
  for (const baseUrl of baseUrls) {
    results[baseUrl] = {};
    
    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`;
      
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: event.httpMethod === 'POST' ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: event.httpMethod === 'POST' ? JSON.stringify({
            test: true,
            source: 'direct-api-check'
          }) : undefined
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let responseBody;
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = "[Failed to read response body]";
        }
        
        results[baseUrl][endpoint] = {
          status: response.status,
          success: response.ok,
          responseTime: `${responseTime}ms`,
          responseBody: responseBody.substring(0, 100) + (responseBody.length > 100 ? '...' : '')
        };
      } catch (error) {
        results[baseUrl][endpoint] = {
          status: 'Error',
          success: false,
          error: error.message
        };
      }
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      environment: process.env.NODE_ENV,
      deployUrl: process.env.DEPLOY_URL,
      url: process.env.URL,
      method: event.httpMethod,
      results
    }, null, 2)
  };
};
