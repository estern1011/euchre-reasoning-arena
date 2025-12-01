# Euchre Reasoning Arena API Documentation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Required API keys:
- `OPENAI_API_KEY` - For GPT models
- `ANTHROPIC_API_KEY` - For Claude models  
- `GOOGLE_GENERATIVE_AI_API_KEY` - For Gemini models

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## API Endpoints

### GET `/api/models`

Get list of available AI models.

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "description": "Most capable OpenAI model",
      "speed": "slow",
      "cost": "high"
    },
    ...
  ]
}
```

---

### POST `/api/new-game`

Create a new Euchre game.

**Request Body:**
```json
{
  "modelIds": ["gpt-4", "claude-3-5-sonnet-20241022", "gemini-1.5-pro", "gpt-3.5-turbo"],
  "dealer": "north"
}
```

**Response:**
```json
{
  "gameState": {
    "id": "uuid",
    "phase": "trump_selection",
    "players": [...],
    "trump": null,
    "dealer": "north",
    "trumpSelection": {
      "turnedUpCard": {"suit": "hearts", "rank": "ace"},
      "dealer": "north",
      "currentBidder": "east",
      "round": 1,
      "bids": []
    },
    ...
  },
  "message": "New game created..."
}
```

---

### POST `/api/play-next-round`

Advance the game by one round (trump selection or trick).

**Request Body:**
```json
{
  "gameState": { ... },  // Current game state
  "modelIds": ["gpt-4", "claude-3-5-sonnet-20241022", "gemini-1.5-pro", "gpt-3.5-turbo"]
}
```

**Response:**
```json
{
  "gameState": { ... },  // Updated game state
  "phase": "trump_selection_round_1" | "trump_selection_round_2" | "playing_trick" | "game_complete",
  "decisions": [
    {
      "player": "east",
      "modelId": "gpt-4",
      "action": "order_up",
      "goingAlone": false,
      "reasoning": "I have strong trump cards...",
      "duration": 2341
    },
    ...
  ],
  "roundSummary": "Trump selection round 1 complete. east called hearts as trump"
}
```

**Decision Types:**

Trump Bid Decision:
```typescript
{
  player: Position;
  modelId: string;
  action: "order_up" | "call_trump" | "pass";
  suit?: Suit;  // Only for call_trump
  goingAlone: boolean;
  reasoning: string;
  duration: number;  // milliseconds
}
```

Card Play Decision:
```typescript
{
  player: Position;
  modelId: string;
  card: { suit: Suit; rank: string };
  reasoning: string;
  duration: number;  // milliseconds
}
```

---

## Game Flow

1. **Create New Game**
   ```
   POST /api/new-game
   ```

2. **Trump Selection Round 1**
   - All 4 players bid (order up or pass)
   ```
   POST /api/play-next-round
   ```

3. **Trump Selection Round 2** (if all passed)
   - All 4 players bid (call trump or pass)
   - Dealer cannot pass if last
   ```
   POST /api/play-next-round
   ```

4. **Play 5 Tricks**
   - Each trick: 3-4 players play cards (3 if going alone)
   ```
   POST /api/play-next-round  (x5)
   ```

5. **Game Complete**
   - Final scores calculated
   - Winner determined

---

## Example Usage

```javascript
// 1. Create new game
const newGameResponse = await fetch('http://localhost:3000/api/new-game', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelIds: ['gpt-4', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro', 'gpt-3.5-turbo']
  })
});
let { gameState } = await newGameResponse.json();

// 2. Play through trump selection and tricks
while (gameState.phase !== 'complete') {
  const roundResponse = await fetch('http://localhost:3000/api/play-next-round', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameState })
  });
  
  const result = await roundResponse.json();
  gameState = result.gameState;
  
  console.log(result.roundSummary);
  console.log('Decisions:', result.decisions);
}

console.log('Final scores:', gameState.scores);
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Server error (e.g., AI API failure)

Error response format:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

---

## Rate Limiting

No rate limiting currently implemented. Use responsibly to avoid excessive AI API costs.

---

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```
