# License Activation Middleware Server

This is a completely independent middleware server that acts as an intermediary between your client applications and the license activation server.

## Features

- Forwards all license activation API requests to the main license server
- Completely independent with its own dependencies
- Can be hosted separately from the main license server
- Supports CORS for web client requests

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the license server URL (optional):
   ```bash
   export LICENSE_SERVER_URL=http://your-license-server.com
   ```
   Or on Windows:
   ```cmd
   set LICENSE_SERVER_URL=http://your-license-server.com
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

All requests are forwarded to the corresponding endpoints on the license server:

- `POST /api/activate` - Forward activation requests
- `POST /api/users/:id/approve` - Forward user approval requests
- `POST /api/users/:id/generate-key` - Forward key generation requests
- `POST /api/users/:id/reject` - Forward user rejection requests
- `GET /api/users/:id/key` - Forward key retrieval requests
- `GET /api/users/:id` - Forward user retrieval requests
- `GET /api/users` - Forward all users retrieval requests

## Configuration

- `LICENSE_SERVER_URL` - The URL of your license activation server (default: http://localhost:3000)
- `PORT` - The port to run the middleware server on (default: 4000)

## Hosting

This server can be hosted independently on any cloud platform that supports Node.js applications, such as:
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service
- DigitalOcean App Platform