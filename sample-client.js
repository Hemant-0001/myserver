const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001; // Different port from your main server

// Middleware
app.use(express.json());

// Configuration - Use your deployed Render URL here
const MIDDLEWARE_SERVER_URL = process.env.MIDDLEWARE_SERVER_URL || 'https://your-app-name.onrender.com';

// Sample endpoint that creates a request to the middleware
app.post('/api/sample-request', async (req, res) => {
  try {
    console.log('Sending request to middleware server...');
    
    // Prepare the request data
    const requestData = {
      method: 'POST',
      url: '/api/activate',
      headers: {
        'x-activation-secret': 'sample-secret-key'
      },
      body: {
        productId: 'ABC123',
        userId: 'user123',
        licenseType: 'standard'
      }
    };
    
    // Send request to middleware server
    const response = await fetch(`${MIDDLEWARE_SERVER_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Request sent successfully, request ID:', result.requestId);
      
      // Store the request ID for later polling
      const requestId = result.requestId;
      
      // Poll for the response (in a real app, you might do this periodically)
      setTimeout(async () => {
        try {
          const responseResponse = await fetch(`${MIDDLEWARE_SERVER_URL}/api/responses/${requestId}`);
          const responseResult = await responseResponse.json();
          
          if (responseResponse.ok) {
            console.log('Received response from middleware:', responseResult);
            res.json({
              message: 'Request processed successfully',
              originalRequest: requestData,
              response: responseResult
            });
          } else {
            console.log('Response not ready yet or error occurred:', responseResult);
            res.status(404).json({
              message: 'Response not ready yet',
              requestId: requestId
            });
          }
        } catch (error) {
          console.error('Error polling for response:', error);
          res.status(500).json({ error: 'Failed to poll for response' });
        }
      }, 5000); // Wait 5 seconds before polling for response
    } else {
      console.error('Failed to send request to middleware:', result);
      res.status(500).json({ error: 'Failed to send request to middleware', details: result });
    }
  } catch (error) {
    console.error('Error sending request to middleware:', error);
    res.status(500).json({ error: 'Failed to send request to middleware' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sample Client Server is running',
    middlewareServerUrl: MIDDLEWARE_SERVER_URL
  });
});

app.listen(PORT, () => {
  console.log(`Sample Client Server is running on port ${PORT}`);
  console.log(`Middleware server URL: ${MIDDLEWARE_SERVER_URL}`);
});