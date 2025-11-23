# License Activation Server

This server handles license requests from clients and manages the communication between clients and the local activation server.

## API Endpoints

### Client Endpoints

#### Submit License Request
```
POST /api/license-request
```

Submit a new license request.

**Request Body:**
```json
{
  "productKey": "string",
  "email": "string",
  "machineId": "string"
}
```

**Response:**
```json
{
  "message": "License request submitted successfully",
  "requestId": "number"
}
```

#### Check License Result
```
GET /api/license-result/:requestId
```

Check the status and result of a license request.

**Response (Pending):**
```json
{
  "status": "pending",
  "message": "License request is still being processed"
}
```

**Response (Completed):**
```json
{
  "status": "completed",
  "licenseKey": "string"
}
```

### Local Server Endpoints

#### Fetch Pending Requests
```
GET /api/pending
```

Retrieve all pending license requests.

**Response:**
```json
[
  {
    "id": "number",
    "timestamp": "date",
    "method": "string",
    "url": "string",
    "headers": "string",
    "body": "string",
    "status": "string",
    "response": "string",
    "responseStatus": "number"
  }
]
```

#### Resolve Request
```
POST /api/resolve
```

Submit a license key for a processed request.

**Request Body:**
```json
{
  "requestId": "number",
  "licenseKey": "string"
}
```

**Response:**
```json
{
  "message": "License key recorded successfully"
}
```

## Health Check

```
GET /
GET /health
```

Check if the server is running.

**Response:**
```json
{
  "message": "License Activation Server is running"
}
```