# Euchre Reasoning Arena API Documentation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Vercel AI Gateway

Copy `.env.example` to `.env` and add your Vercel AI Gateway token:

```bash
cp .env.example .env
```

Required environment variable:
- `VERCEL_AI_GATEWAY_TOKEN` - Single token for access to all AI providers (OpenAI, Anthropic, Google, xAI)

Get your token from: https://vercel.com/docs/ai-gateway

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## API Endpoints

### GET `/api/models`

Get list of available AI models via Vercel AI Gateway (fast and cheap models only).

**Response:**
```json
{
  "models": [
    {
      "id": "google/gemini-2.5-flash-lite",
      "name": "Gemini 2.5 Flash-Lite",
      "provider": "google",
      "description": "Cheapest and fastest - optimized for speed and cost-efficiency",
      "speed": "fast",
      "cost": "low",
      "pricing": {
        "input": "$0.10/M",
        "output": "$0.40/M"
      },
      "contextWindow": "1M"
    },
    {
      "id": "xai/grok-code-fast-1",
      "name": "Grok Code Fast",
      "provider": "xai",
      "description": "Fast code-focused model from xAI",
      "speed": "fast",
      "cost": "low",
      "pricing": {
        "input": "$0.20/M",
        "output": "$1.50/M"
      },
      "contextWindow": "256K"
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
  "modelIds": [
    "google/gemini-2.5-flash-lite",
    "xai/grok-code-fast-1",
    "google/gemini-2.5-flash",
    "anthropic/claude-haiku-4.5"
  ],
  "dealer": "north"
}
```

**Response:**
```json
{
  "gameState": {
    "id": "uuid",
    "phase": "trump_selection",
    "players": [
      {
        "position": "north",
        "team": 0,
        "modelId": "google/gemini-2.5-flash-lite",
        "hand": [...]
      },
      {
        "position": "east",
        "team": 1,
        "modelId": "xai/grok-code-fast-1",
        "hand": [...]
      },
      {
        "position": "south",
        "team": 0,
        "modelId": "google/gemini-2.5-flash",
        "hand": [...]
      },
      {
        "position": "west",
        "team": 1,
        "modelId": "anthropic/claude-haiku-4.5",
        "hand": [...]
      }
    ],
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
  "message": "New game created with google/gemini-2.5-flash-lite, xai/grok-code-fast-1, google/gemini-2.5-flash, anthropic/claude-haiku-4.5. Dealer: north. First bidder: east"
}
```

---

### POST `/api/play-next-round`

Advance the game by one round (trump selection or trick).

**Request Body:**
```json
{
  "gameState": { ... },  // Current game state (optional - creates new game if omitted)
  "modelIds": [
    "google/gemini-2.5-flash-lite",
    "xai/grok-code-fast-1",
    "google/gemini-2.5-flash",
    "anthropic/claude-haiku-4.5"
  ]  // Optional - only used if creating new game
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
      "modelId": "xai/grok-code-fast-1",
      "action": "order_up",
      "goingAlone": false,
      "reasoning": "I have strong trump cards with the Jack and Ace of hearts...",
      "duration": 1234
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

## Available Models

All models are accessed via Vercel AI Gateway. Model IDs include provider prefix.

### Fast & Cheap Models (Default)

| Model ID | Provider | Input Price | Output Price | Context | Speed |
|----------|----------|-------------|--------------|---------|-------|
| `google/gemini-2.5-flash-lite` | Google | $0.10/M | $0.40/M | 1M | Fast |
| `xai/grok-code-fast-1` | xAI | $0.20/M | $1.50/M | 256K | Fast |
| `google/gemini-2.5-flash` | Google | $0.30/M | $2.50/M | 1M | Fast |
| `anthropic/claude-haiku-4.5` | Anthropic | $1.00/M | $5.00/M | 200K | Fast |

### Additional Models

| Model ID | Provider | Input Price | Output Price | Context | Speed |
|----------|----------|-------------|--------------|---------|-------|
| `openai/gpt-5` | OpenAI | $1.25/M | $10.00/M | 400K | Medium |
| `google/gemini-3-pro-preview` | Google | $2.00/M | $12.00/M | 1M | Medium |
| `anthropic/claude-sonnet-4.5` | Anthropic | $3.00/M | $15.00/M | 200K | Medium |

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
// 1. Get available models
const modelsResponse = await fetch('http://localhost:3000/api/models');
const { models } = await modelsResponse.json();
console.log('Available models:', models);

// 2. Create new game with fast & cheap models
const newGameResponse = await fetch('http://localhost:3000/api/new-game', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelIds: [
      'google/gemini-2.5-flash-lite',
      'xai/grok-code-fast-1',
      'google/gemini-2.5-flash',
      'anthropic/claude-haiku-4.5'
    ]
  })
});
let { gameState } = await newGameResponse.json();

// 3. Play through trump selection and tricks
while (gameState.phase !== 'complete') {
  const roundResponse = await fetch('http://localhost:3000/api/play-next-round', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameState })
  });
  
  const result = await roundResponse.json();
  gameState = result.gameState;
  
  console.log(result.roundSummary);
  console.log('AI Decisions:', result.decisions.map(d => ({
    player: d.player,
    model: d.modelId,
    duration: `${d.duration}ms`,
    reasoning: d.reasoning.substring(0, 100) + '...'
  })));
}

console.log('Final scores:', gameState.scores);
console.log('Winner:', gameState.scores[0] > gameState.scores[1] ? 'Team 0' : 'Team 1');
```

---

## Cost Estimation

With default fast & cheap models, approximate costs per game:

**Trump Selection (8 decisions):**
- ~500 tokens input per decision
- ~100 tokens output per decision
- Total: ~4,000 input + ~800 output tokens
- Cost: ~$0.0005

**Playing 5 Tricks (15-20 decisions):**
- ~800 tokens input per decision
- ~100 tokens output per decision
- Total: ~14,000 input + ~1,800 output tokens
- Cost: ~$0.002

**Total per game: ~$0.0025** (with cheapest models)

Using all `google/gemini-2.5-flash-lite` would reduce cost to ~$0.0015 per game.

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

Common errors:
- `VERCEL_AI_GATEWAY_TOKEN not set` - Missing environment variable
- `Unknown model: xyz` - Invalid model ID (must include provider prefix)
- `Invalid game state` - Malformed game state object

---

## Rate Limiting

No rate limiting currently implemented. Use responsibly to avoid excessive AI API costs.

Recommended limits:
- Max 100 games/hour in development
- Monitor your Vercel AI Gateway usage dashboard

---

## Development

### Running Tests

```bash
npm test
```

Current coverage: 98.01% (177 passing tests)

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```
