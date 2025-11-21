const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:3000';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'License Activation Middleware Server is running',
    licenseServerUrl: LICENSE_SERVER_URL
  });
});

// Endpoint for client local servers to send requests
app.post('/api/requests', async (req, res) => {
  try {
    const { method, url, headers, body } = req.body;
    
    // Store request data in database
    const request = await prisma.request.create({
      data: {
        method,
        url,
        headers: JSON.stringify(headers),
        body: JSON.stringify(body)
      }
    });
    
    res.json({ 
      message: 'Request stored successfully', 
      requestId: request.id 
    });
  } catch (error) {
    console.error('Error inserting request:', error);
    res.status(500).json({ error: 'Failed to store request' });
  }
});

// Endpoint for your local server to poll for pending requests
app.get('/api/requests/pending', async (req, res) => {
  try {
    // Get pending requests from database
    const requests = await prisma.request.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    res.json(requests);
  } catch (error) {
    console.error('Error retrieving pending requests:', error);
    res.status(500).json({ error: 'Failed to retrieve pending requests' });
  }
});

// Endpoint for your local server to submit responses
app.post('/api/responses', async (req, res) => {
  try {
    const { requestId, status, data } = req.body;
    
    // Update request with response data
    const request = await prisma.request.update({
      where: {
        id: parseInt(requestId)
      },
      data: {
        status: 'completed',
        response: JSON.stringify(data),
        responseStatus: status
      }
    });
    
    res.json({ message: 'Response recorded successfully' });
  } catch (error) {
    console.error('Error updating request:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Endpoint for client local servers to get responses
app.get('/api/responses/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    
    // Get completed request with response
    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
        status: 'completed'
      }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Response not found or not completed yet' });
    }
    
    res.json({
      status: request.responseStatus,
      data: JSON.parse(request.response)
    });
  } catch (error) {
    console.error('Error retrieving response:', error);
    res.status(500).json({ error: 'Failed to retrieve response' });
  }
});

// Legacy endpoints for backward compatibility
// Forward activation requests to the license server
app.post('/api/activate', async (req, res) => {
  try {
    console.log('Forwarding activation request to license server...');
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-activation-secret': req.headers['x-activation-secret'] || 'change-this-to-a-strong-secret'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding activation request:', error);
    res.status(500).json({ error: 'Failed to forward activation request' });
  }
});

// Forward user approval requests to the license server
app.post('/api/users/:id/approve', async (req, res) => {
  try {
    console.log(`Forwarding approval request for user ${req.params.id} to license server...`);
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users/${req.params.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding approval request:', error);
    res.status(500).json({ error: 'Failed to forward approval request' });
  }
});

// Forward key generation requests to the license server
app.post('/api/users/:id/generate-key', async (req, res) => {
  try {
    console.log(`Forwarding key generation request for user ${req.params.id} to license server...`);
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users/${req.params.id}/generate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding key generation request:', error);
    res.status(500).json({ error: 'Failed to forward key generation request' });
  }
});

// Forward user rejection requests to the license server
app.post('/api/users/:id/reject', async (req, res) => {
  try {
    console.log(`Forwarding rejection request for user ${req.params.id} to license server...`);
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users/${req.params.id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding rejection request:', error);
    res.status(500).json({ error: 'Failed to forward rejection request' });
  }
});

// Forward key retrieval requests to the license server
app.get('/api/users/:id/key', async (req, res) => {
  try {
    console.log(`Forwarding key retrieval request for user ${req.params.id} to license server...`);
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users/${req.params.id}/key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding key retrieval request:', error);
    res.status(500).json({ error: 'Failed to forward key retrieval request' });
  }
});

// Forward user retrieval requests to the license server
app.get('/api/users/:id', async (req, res) => {
  try {
    console.log(`Forwarding user retrieval request for user ${req.params.id} to license server...`);
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users/${req.params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding user retrieval request:', error);
    res.status(500).json({ error: 'Failed to forward user retrieval request' });
  }
});

// Forward all users retrieval requests to the license server
app.get('/api/users', async (req, res) => {
  try {
    console.log('Forwarding all users retrieval request to license server...');
    
    const response = await fetch(`${LICENSE_SERVER_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding all users retrieval request:', error);
    res.status(500).json({ error: 'Failed to forward all users retrieval request' });
  }
});

app.listen(PORT, async () => {
  console.log(`License Activation Middleware Server is running on port ${PORT}`);
  console.log(`Forwarding requests to: ${LICENSE_SERVER_URL}`);
  
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
});