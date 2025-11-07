# Teams API

Express.js + TypeScript backend for the My Teams application.

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
This will start the server on http://localhost:3000 with hot reload enabled.

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## API Endpoints

### Players
* `GET /api/players` - Get all players
* `GET /api/players/:id` - Get a player by ID
* `POST /api/players` - Create a new player
* `PUT /api/players/:id` - Update an existing player
* `DELETE /api/players/:id` - Delete a player

### Events
* `GET /api/events` - Get all events
* `GET /api/events/:id` - Get an event by ID
* `POST /api/events` - Create a new event
* `PUT /api/events/:id` - Update an existing event
* `DELETE /api/events/:id` - Delete an event
* `PUT /api/events/:id/players` - Upsert invitations for an event
* `PUT /api/events/:id/players/:player_id/status` - Update invitation status
* `PUT /api/events/:id/selection` - Update player selection for teams

### Health Check
* `GET /health` - Check if the API is running

## Data Models

### Player
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "birthYear": "number",
  "level": "number (1-5)"
}
```

### Event
```json
{
  "id": "string",
  "name": "string",
  "date": "string (ISO date)",
  "startTime": "string",
  "maxPlayersPerTeam": "number",
  "teams": [Team],
  "invitations": [Invitation]
}
```

### Team
```json
{
  "id": "string",
  "name": "string",
  "strength": "number (1-5)",
  "selectedPlayers": ["string (player IDs)"]
}
```

### Invitation
```json
{
  "id": "string",
  "playerId": "string",
  "status": "open | accepted | declined"
}
```

## Technology Stack
- Express.js - Web framework
- TypeScript - Type safety
- tsx - TypeScript execution and hot reload
- In-memory data store (can be replaced with a database)