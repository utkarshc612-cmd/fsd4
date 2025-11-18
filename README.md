# 🚀 Fullstack App (Frontend + Backend)

A modern full-stack web application with a beautiful frontend and robust backend API.

## Features

### Backend
- Express.js server with multiple API endpoints
- JSON request/response handling
- Error handling middleware
- Static file serving

### Frontend
- Responsive modern UI with gradient background
- Multiple interactive buttons
- Real-time API integration
- Pretty JSON display

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hello` | Returns greeting with timestamp |
| GET | `/api/status` | Returns server status and uptime |
| POST | `/api/echo` | Echo back posted message |

## How to run locally

**Requirements:** Node.js (v14+ recommended) and npm installed.

### Setup & Run

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
```

3. Open your browser at `http://localhost:3000/`

4. Try the buttons:
   - **Call /api/hello** - Get a greeting from the server
   - **Check Status** - View server uptime
   - **Echo Message** - Send a message to the server and get it back

## Configuration

- **Port:** Default is `3000`. To change: `PORT=8080 npm start`
- The backend automatically serves all files from the `frontend/` folder

## Project Structure

```
fullstack_app/
├── backend/
│   ├── index.js           # Express server with API routes
│   └── package.json       # Dependencies
└── frontend/
    ├── index.html         # Main HTML page
    ├── app.js             # JavaScript frontend logic
    └── styles.css         # Styling
```

