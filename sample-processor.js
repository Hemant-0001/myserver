const fetch = require('node-fetch');

// Configuration - Use your deployed Render URL here
const MIDDLEWARE_SERVER_URL = process.env.MIDDLEWARE_SERVER_URL || 'https://your-app-name.onrender.com';
const POLLING_INTERVAL = 5000; // Poll every 5 seconds

console.log('Sample Processor Server starting...');
console.log(`Middleware server URL: ${MIDDLEWARE_SERVER_URL}`);

// Function to process a request
async function processRequest(request) {
  console.log('Processing request:', request);
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In a real implementation, you would:
  // 1. Parse the request data
  // 2. Perform the actual license activation or other business logic
  // 3. Generate an appropriate response
  
  // For this sample, we'll just create a mock response
  const mockResponse = {
    success: true,
    message: 'Request processed successfully',
    requestId: request.id,
    timestamp: new Date().toISOString(),
    data: {
      licenseKey: 'LIC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      userId: JSON.parse(request.body).userId
    }
  };
  
  return mockResponse;
}

// Function to poll for pending requests
async function pollForRequests() {
  try {
    console.log('Polling for pending requests...');
    
    const response = await fetch(`${MIDDLEWARE_SERVER_URL}/api/requests/pending`);
    const requests = await response.json();
    
    if (requests.length > 0) {
      console.log(`Found ${requests.length} pending request(s)`);
      
      // Process each request
      for (const request of requests) {
        try {
          console.log('Processing request ID:', request.id);
          
          // Process the request
          const result = await processRequest(request);
          
          // Send the response back to the middleware
          const responseResponse = await fetch(`${MIDDLEWARE_SERVER_URL}/api/responses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requestId: request.id,
              status: 200,
              data: result
            })
          });
          
          const responseResult = await responseResponse.json();
          
          if (responseResponse.ok) {
            console.log('Response sent successfully for request ID:', request.id);
          } else {
            console.error('Failed to send response for request ID:', request.id, responseResult);
          }
        } catch (error) {
          console.error('Error processing request ID:', request.id, error);
        }
      }
    } else {
      console.log('No pending requests found');
    }
  } catch (error) {
    console.error('Error polling for requests:', error);
  }
}

// Start polling
console.log('Starting polling process...');
setInterval(pollForRequests, POLLING_INTERVAL);

// Run once immediately
pollForRequests();

console.log('Sample Processor Server is running and polling for requests...');