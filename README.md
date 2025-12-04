# Euchre Reasoning Arena

![Tests](https://github.com/estern1011/euchre-reasoning-arena/workflows/Tests/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-397%20passing-brightgreen)

An interactive playground for exploring, comparing, and evaluating AI strategic reasoning through the card game Euchre.

Built for the AI Gateway Game Hackathon - Model Eval Game Category.

## Setup

Install dependencies:

```bash
bun install
```

## Development

Start the development server on `http://localhost:3000`:

```bash
bun run dev
```

## Testing

Run tests with Vitest:

```bash
# Run tests in watch mode
bun test

# Run tests once
bun run test:run

# Run tests with coverage report
bun run test:coverage

# Open Vitest UI
bun run test:ui
```

**Current Test Coverage:**
- ✅ **397 tests passing**
- ✅ **98% statement coverage**
- ✅ **94% branch coverage**
- ✅ **100% function coverage**

## Production

Build the application for production:

```bash
bun run build
```

Preview production build:

```bash
bun run preview
```

## Project Structure

```
euchre-reasoning-arena/
├── app/                      # Nuxt frontend
│   ├── pages/               # Vue pages
│   └── components/          # Vue components
├── server/                   # Nuxt server
│   └── api/                 # API endpoints (serverless functions)
├── lib/                      # Shared game logic
│   └── game/
│       ├── __tests__/       # Test files
│       ├── types.ts         # TypeScript types
│       ├── card.ts          # Card logic (bowers, comparisons)
│       ├── game.ts          # Game state management
│       └── utils.ts         # Helper functions
└── public/                   # Static assets
```

## Tech Stack

- **Framework:** Nuxt 3
- **Language:** TypeScript
- **UI:** Vue 3 + Tailwind CSS
- **AI:** Vercel AI SDK
- **Testing:** Vitest
- **Runtime:** Bun
- **Deployment:** Vercel

## Game Engine Features

The game engine implements full Euchre rules with comprehensive test coverage:

**Core Features:**
- ✅ Trump selection (2-round bidding with order-up and call-trump)
- ✅ Going alone support with partner skip logic
- ✅ Dealer discard after ordering up
- ✅ Bower logic (right bower, left bower)
- ✅ Suit-following validation
- ✅ Trick winner determination (3-card and 4-card tricks)
- ✅ Proper Euchre scoring (march, euchre, going alone bonuses)
- ✅ Custom error types with detailed messages

**Test Coverage:**
- 397 tests across 17 test suites
- Tests for all game phases: trump selection → playing → complete
- Edge case coverage for invalid plays, corrupt state, going alone scenarios
- AI agent tests: retry logic, illegal moves, streaming variants
- 98% statement coverage, 100% function coverage

## Contributing

This is a hackathon project. See [PRD.md](./PRD.md) for product requirements and roadmap.

## License

MIT
