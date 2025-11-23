const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET / - Health check request from ${req.ip}`);
  res.json({ 
    message: 'License Activation Server is running'
  });
});

// Endpoint for client to send license requests
app.post('/api/license-request', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/license-request - New license request received`);
    console.log(`  Source IP: ${req.ip}`);
    console.log(`  User Agent: ${req.get('User-Agent')}`);
    console.log(`  Request Body:`, req.body);
    
    const { productKey, email, machineId, username } = req.body;
    
    // Validate request - either email or username is required
    if (!productKey || (!email && !username) || !machineId) {
      console.log(`  Validation failed - Missing required fields`);
      return res.status(400).json({ error: 'Missing required fields: productKey, (email or username), machineId' });
    }
    
    // Store license request in database as PENDING
    // If username is provided, use it; otherwise use email
    const userIdentifier = username || email;
    
    const request = await prisma.request.create({
      data: {
        method: 'LICENSE_REQUEST',
        url: '/api/license-request',
        headers: JSON.stringify(req.headers),
        body: JSON.stringify({ productKey, email, machineId, username }),
        status: 'pending'
      }
    });
    
    console.log(`  Request stored successfully with ID: ${request.id}`);
    
    res.json({ 
      message: 'License request submitted successfully', 
      requestId: request.id 
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error submitting license request:`, error);
    res.status(500).json({ error: 'Failed to submit license request' });
  }
});

// Endpoint for local server to fetch pending requests
app.get('/api/pending', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] GET /api/pending - Fetch pending requests`);
    console.log(`  Source IP: ${req.ip}`);
    console.log(`  User Agent: ${req.get('User-Agent')}`);
    
    // Get pending requests from database
    const requests = await prisma.request.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    console.log(`  Found ${requests.length} pending requests`);
    
    res.json(requests);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error retrieving pending requests:`, error);
    res.status(500).json({ error: 'Failed to retrieve pending requests' });
  }
});

// Endpoint for local server to send back processed results
app.post('/api/resolve', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/resolve - Process license result`);
    console.log(`  Source IP: ${req.ip}`);
    console.log(`  User Agent: ${req.get('User-Agent')}`);
    console.log(`  Request Body:`, req.body);
    
    const { requestId, licenseKey, rejected } = req.body;
    
    // Validate request
    if (!requestId) {
      console.log(`  Validation failed - Missing requestId`);
      return res.status(400).json({ error: 'Missing required field: requestId' });
    }
    
    if (rejected) {
      console.log(`  Processing rejection for request ID: ${requestId}`);
      // Handle rejected request
      const request = await prisma.request.update({
        where: {
          id: parseInt(requestId)
        },
        data: {
          status: 'rejected',
          response: JSON.stringify({ error: 'License request was rejected' }),
          responseStatus: 403
        }
      });
      
      console.log(`  Request ${requestId} marked as rejected`);
      res.json({ message: 'Request rejection recorded successfully' });
    } else if (licenseKey) {
      console.log(`  Processing license key for request ID: ${requestId}`);
      // Handle successful license generation
      const request = await prisma.request.update({
        where: {
          id: parseInt(requestId)
        },
        data: {
          status: 'completed',
          response: JSON.stringify({ licenseKey }),
          responseStatus: 200
        }
      });
      
      console.log(`  License key recorded for request ${requestId}`);
      res.json({ message: 'License key recorded successfully' });
    } else {
      console.log(`  Validation failed - Either licenseKey or rejected must be provided`);
      return res.status(400).json({ error: 'Either licenseKey or rejected must be provided' });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error recording license key:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.status(500).json({ error: 'Failed to record license key' });
  }
});

// Endpoint for client to check license status and get result
app.get('/api/license-result/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    console.log(`[${new Date().toISOString()}] GET /api/license-result/${requestId} - Check license result`);
    console.log(`  Source IP: ${req.ip}`);
    console.log(`  User Agent: ${req.get('User-Agent')}`);
    
    // Get request with response
    const request = await prisma.request.findUnique({
      where: {
        id: requestId
      }
    });
    
    if (!request) {
      console.log(`  Request ${requestId} not found`);
      return res.status(404).json({ error: 'Request not found' });
    }
    
    console.log(`  Request ${requestId} found with status: ${request.status}`);
    
    // If request is still pending, return appropriate message
    if (request.status === 'pending') {
      console.log(`  Request ${requestId} is still pending`);
      return res.json({ 
        status: 'pending', 
        message: 'License request is still being processed' 
      });
    }
    
    // If request is rejected, return rejection message
    if (request.status === 'rejected') {
      console.log(`  Request ${requestId} was rejected`);
      return res.json({
        status: 'rejected',
        message: 'License request was rejected'
      });
    }
    
    // If request is completed, return the license key
    if (request.status === 'completed') {
      console.log(`  Request ${requestId} completed, returning license key`);
      return res.json({
        status: 'completed',
        licenseKey: JSON.parse(request.response).licenseKey
      });
    }
    
    console.log(`  Unknown request status for ${requestId}: ${request.status}`);
    res.status(500).json({ error: 'Unknown request status' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error retrieving license result:`, error);
    res.status(500).json({ error: 'Failed to retrieve license result' });
  }
});

// Health check endpoint for local server
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /health - Local server health check from ${req.ip}`);
  res.json({ message: 'Online server is running' });
});

app.listen(PORT, async () => {
  console.log(`[${new Date().toISOString()}] License Activation Server is running on port ${PORT}`);
  
  try {
    await prisma.$connect();
    console.log(`[${new Date().toISOString()}] Connected to database`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to connect to database:`, error);
  }
});