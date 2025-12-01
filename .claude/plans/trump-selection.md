# Trump Selection Implementation Plan

## Overview
Add proper Euchre trump selection phase to the game, including the turned-up card, two-round bidding, and going alone option.

## Current State Analysis

**Existing Code:**
- `GameState` has `trump: Suit | null` field
- Simple `setTrump(game, trump)` function exists
- Game deals 5 cards to each player (20 cards total)
- No dealer concept yet
- No turned-up card for bidding
- No trump selection logic

**Current Flow:**
```
createNewGame() 
  → deals 5 cards per player
  → trump is null
  → game ready to play
```

## Euchre Trump Selection Rules

### Card Distribution
- Deal 5 cards to each of 4 players (20 cards)
- Turn up the next card (21st card) face-up for bidding
- Remaining 3 cards stay face-down (the "kitty")

### Round 1: Order Up Phase
- Starting left of dealer, each player can:
  - **Order up**: Make the turned-up suit trump (dealer picks up the card)
  - **Pass**: Decline
- If ordered up:
  - Dealer adds turned-up card to hand (6 cards)
  - Dealer discards one card face-down
  - Trump is set to turned-up suit
  - Proceed to playing phase

### Round 2: Call Trump Phase  
- If all 4 players pass in Round 1
- Dealer turns the card face-down
- Starting left of dealer, each player can:
  - **Call trump**: Name any suit EXCEPT the turned-up suit
  - **Pass**: Decline
- Dealer cannot pass (must call trump if reaches them)
- Trump is set to called suit
- No card pickup/discard

### Going Alone (Optional for MVP)
- When ordering up or calling trump, player can opt to "go alone"
- Partner sits out the hand
- If going alone wins all 5 tricks: 4 points (instead of 1)
- We can defer this to post-MVP

## Design Approach

### Option A: Add Phase to GameState (Recommended)
**Pros:**
- Clean separation of game phases
- Easy to track where we are
- Follows existing patterns
- Good for AI reasoning ("we're in trump selection")

**Cons:**
- More complex state machine

**Structure:**
```typescript
interface GameState {
  // ... existing fields
  phase: 'trump_selection' | 'playing' | 'complete'
  trumpSelection?: TrumpSelectionState
}

interface TrumpSelectionState {
  turnedUpCard: Card
  dealer: Position
  currentBidder: Position
  round: 1 | 2  // Round 1: order up, Round 2: call trump
  bids: TrumpBid[]
}

interface TrumpBid {
  player: Position
  action: 'order_up' | 'call_trump' | 'pass'
  suit?: Suit  // For call_trump
  goingAlone?: boolean  // Optional for MVP
  reasoning?: string  // For AI decisions
}
```

### Option B: Separate Trump Selection Game
**Pros:**
- Keep GameState simple
- Could run trump selection independently

**Cons:**
- Duplicate code for player management
- Harder to track full game history
- Doesn't match PRD structure

### Option C: Simplified (No Second Round)
**Pros:**
- Simpler implementation
- Faster gameplay

**Cons:**
- Not real Euchre
- Loses strategic depth
- Defeats purpose of adding trump selection

**Recommendation:** Option A - proper phase management

## Implementation Plan

### 1. Type Definitions (types.ts)

```typescript
export type GamePhase = 'trump_selection' | 'playing' | 'complete';

export type TrumpBidAction = 'order_up' | 'call_trump' | 'pass';

export interface TrumpBid {
  player: Position;
  action: TrumpBidAction;
  suit?: Suit;  // Only for call_trump
  goingAlone?: boolean;  // Optional for MVP
  reasoning?: string;
}

export interface TrumpSelectionState {
  turnedUpCard: Card;
  dealer: Position;
  currentBidder: Position;
  round: 1 | 2;
  bids: TrumpBid[];
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  trump: Suit | null;
  trumpCaller?: Position;  // Track who called trump (for scoring)
  trumpSelection?: TrumpSelectionState;  // Only present during trump_selection phase
  dealer: Position;  // Add dealer to main state
  currentTrick: Trick;
  completedTricks: Trick[];
  scores: [number, number];
}
```

### 2. Update createNewGame (game.ts)

```typescript
export function createNewGame(
  modelIds: [string, string, string, string],
  dealer: Position = 'north'  // Allow specifying dealer, default north
): GameState {
  const deck = shuffleDeck(createDeck());

  const positions: Position[] = ["north", "east", "south", "west"];
  const players: Player[] = positions.map((position, index) => ({
    position,
    team: (index % 2) as 0 | 1,
    hand: deck.slice(index * 5, (index + 1) * 5),  // 5 cards each
    modelId: modelIds[index],
  }));

  // 21st card is turned up for bidding
  const turnedUpCard = deck[20];
  
  // First bidder is left of dealer (clockwise)
  const dealerIndex = positionToIndex(dealer);
  const firstBidder = indexToPosition((dealerIndex + 1) % 4);

  return {
    id: crypto.randomUUID(),
    phase: 'trump_selection',
    players,
    trump: null,
    dealer,
    trumpSelection: {
      turnedUpCard,
      dealer,
      currentBidder: firstBidder,
      round: 1,
      bids: [],
    },
    currentTrick: {
      leadPlayer: firstBidder,  // Will be updated after trump selection
      plays: [],
      winner: undefined,
    },
    completedTricks: [],
    scores: [0, 0],
  };
}
```

### 3. Trump Selection Functions (game.ts)

```typescript
/**
 * Get the next bidder in trump selection
 */
export function getNextBidder(game: GameState): Position | null {
  if (!game.trumpSelection) return null;
  
  const { currentBidder, dealer, round, bids } = game.trumpSelection;
  
  // If we've gone around the table (4 bids this round)
  const bidsThisRound = bids.filter(b => 
    round === 1 ? (b.action === 'order_up' || b.action === 'pass') : b.action !== 'order_up'
  );
  
  if (bidsThisRound.length === 4) {
    return null;  // Round complete
  }
  
  // Next bidder is clockwise
  const currentIndex = positionToIndex(currentBidder);
  return indexToPosition((currentIndex + 1) % 4);
}

/**
 * Make a trump selection bid
 */
export function makeTrumpBid(
  game: GameState,
  player: Position,
  action: TrumpBidAction,
  suit?: Suit,
  goingAlone: boolean = false,
  reasoning?: string
): GameState {
  if (game.phase !== 'trump_selection') {
    throw new InvalidGameStateError('Not in trump selection phase');
  }
  
  if (!game.trumpSelection) {
    throw new InvalidGameStateError('No trump selection state');
  }
  
  if (player !== game.trumpSelection.currentBidder) {
    throw new InvalidPlayError(
      `Not ${player}'s turn to bid (expected ${game.trumpSelection.currentBidder})`,
      player,
      null as any
    );
  }
  
  // Validate bid action
  const { round, turnedUpCard, dealer } = game.trumpSelection;
  
  if (round === 1 && action === 'call_trump') {
    throw new InvalidPlayError('Cannot call trump in round 1', player, null as any);
  }
  
  if (round === 2 && action === 'order_up') {
    throw new InvalidPlayError('Cannot order up in round 2', player, null as any);
  }
  
  if (action === 'call_trump' && !suit) {
    throw new InvalidPlayError('Must specify suit when calling trump', player, null as any);
  }
  
  if (action === 'call_trump' && suit === turnedUpCard.suit) {
    throw new InvalidPlayError('Cannot call turned-up suit in round 2', player, null as any);
  }
  
  // Dealer cannot pass in round 2 if last to bid
  const bidsThisRound = game.trumpSelection.bids.filter(b => 
    round === 2 ? b.action !== 'order_up' : true
  );
  if (round === 2 && player === dealer && bidsThisRound.length === 3 && action === 'pass') {
    throw new InvalidPlayError('Dealer cannot pass in round 2 (must call trump)', player, null as any);
  }
  
  const bid: TrumpBid = {
    player,
    action,
    suit,
    goingAlone,
    reasoning,
  };
  
  const updatedBids = [...game.trumpSelection.bids, bid];
  
  // If someone ordered up or called trump
  if (action === 'order_up' || action === 'call_trump') {
    const trumpSuit = action === 'order_up' ? turnedUpCard.suit : suit!;
    
    // If dealer ordered up, add turned-up card to dealer's hand
    let updatedPlayers = game.players;
    if (action === 'order_up') {
      const dealerIndex = game.players.findIndex(p => p.position === dealer);
      updatedPlayers = [...game.players];
      updatedPlayers[dealerIndex] = {
        ...updatedPlayers[dealerIndex],
        hand: [...updatedPlayers[dealerIndex].hand, turnedUpCard],
      };
    }
    
    // Move to playing phase
    return {
      ...game,
      phase: 'playing',
      trump: trumpSuit,
      trumpCaller: player,
      trumpSelection: undefined,  // Clear trump selection state
      players: updatedPlayers,
      currentTrick: {
        leadPlayer: indexToPosition((positionToIndex(dealer) + 1) % 4),  // Left of dealer leads
        plays: [],
        winner: undefined,
      },
    };
  }
  
  // Everyone passed in round 1 - move to round 2
  const bidsRound1 = updatedBids.filter(b => b.action !== 'call_trump');
  if (round === 1 && bidsRound1.length === 4 && bidsRound1.every(b => b.action === 'pass')) {
    return {
      ...game,
      trumpSelection: {
        ...game.trumpSelection,
        round: 2,
        currentBidder: indexToPosition((positionToIndex(dealer) + 1) % 4),  // Reset to left of dealer
        bids: updatedBids,
      },
    };
  }
  
  // Continue to next bidder
  const nextBidder = getNextBidder({
    ...game,
    trumpSelection: {
      ...game.trumpSelection,
      bids: updatedBids,
    },
  });
  
  if (!nextBidder) {
    throw new InvalidGameStateError('No next bidder found');
  }
  
  return {
    ...game,
    trumpSelection: {
      ...game.trumpSelection,
      currentBidder: nextBidder,
      bids: updatedBids,
    },
  };
}

/**
 * Dealer discards a card after ordering up (dealer must discard down to 5 cards)
 */
export function dealerDiscard(
  game: GameState,
  card: Card
): GameState {
  if (game.phase !== 'playing') {
    throw new InvalidGameStateError('Can only discard after trump is set');
  }
  
  if (!game.trumpCaller) {
    throw new InvalidGameStateError('No trump caller');
  }
  
  // Check if this was an order-up (dealer has 6 cards)
  const dealerObj = game.players.find(p => p.position === game.dealer);
  if (!dealerObj) {
    throw new InvalidGameStateError('Dealer not found');
  }
  
  if (dealerObj.hand.length !== 6) {
    throw new InvalidGameStateError('Dealer does not have 6 cards');
  }
  
  // Remove card from dealer's hand
  const updatedPlayers = game.players.map(p => 
    p.position === game.dealer
      ? { ...p, hand: removeCardFromHand(p.hand, card) }
      : p
  );
  
  return {
    ...game,
    players: updatedPlayers,
  };
}

/**
 * Format trump selection state for AI prompt
 */
export function formatTrumpSelectionForAI(
  game: GameState,
  playerPosition: Position
): string {
  if (!game.trumpSelection) {
    throw new InvalidGameStateError('Not in trump selection phase');
  }
  
  const { turnedUpCard, dealer, round, bids } = game.trumpSelection;
  const player = game.players.find(p => p.position === playerPosition);
  
  if (!player) {
    throw new InvalidGameStateError(`Player not found: ${playerPosition}`);
  }
  
  const partner = game.players.find(
    p => p.team === player.team && p.position !== playerPosition
  );
  
  const bidHistory = bids.length > 0
    ? bids.map(b => 
        b.action === 'pass' 
          ? `  ${b.player}: Pass`
          : b.action === 'order_up'
          ? `  ${b.player}: Order up ${turnedUpCard.suit}`
          : `  ${b.player}: Call ${b.suit} as trump`
      ).join('\n')
    : '  (no bids yet)';
  
  const roundDesc = round === 1 
    ? 'Round 1: Order up the turned-up card or pass'
    : 'Round 2: Call any suit EXCEPT ' + turnedUpCard.suit + ' (or pass)';
    
  return `
Trump Selection - ${roundDesc}
Turned-up card: ${cardToString(turnedUpCard)}
Dealer: ${dealer}
Your position: ${playerPosition} (Team ${player.team})
Your partner: ${partner?.position}
Your hand: ${player.hand.map(cardToString).join(", ")}

Bidding so far:
${bidHistory}

Your turn: What do you bid?
`.trim();
}
```

### 4. Update Existing Functions

**playCard()** - Add phase check:
```typescript
export function playCard(...): GameState {
  if (game.phase !== 'playing') {
    throw new InvalidGameStateError('Cannot play cards during trump selection');
  }
  // ... rest of existing logic
}
```

**validatePlay()** - Add phase check:
```typescript
export function validatePlay(...): { valid: boolean; error?: string } {
  if (game.phase !== 'playing') {
    return { valid: false, error: 'Not in playing phase' };
  }
  // ... rest of existing logic
}
```

### 5. Testing Strategy

**Unit Tests** (lib/game/__tests__/trump-selection.test.ts):
```typescript
describe('Trump Selection', () => {
  describe('createNewGame with trump selection', () => {
    it('should start in trump_selection phase')
    it('should deal 5 cards to each player')
    it('should have a turned-up card')
    it('should set first bidder as left of dealer')
    it('should initialize round 1')
  })
  
  describe('Round 1 - Order Up', () => {
    it('should accept order up bid')
    it('should reject order up when not bidder\'s turn')
    it('should add turned-up card to dealer\'s hand when ordered up')
    it('should set trump suit when ordered up')
    it('should move to playing phase when ordered up')
    it('should move to round 2 if all pass')
    it('should advance to next bidder after pass')
  })
  
  describe('Round 2 - Call Trump', () => {
    it('should accept call trump bid')
    it('should reject calling turned-up suit')
    it('should reject dealer passing when last to bid')
    it('should set trump when called')
    it('should move to playing phase when trump called')
  })
  
  describe('Dealer Discard', () => {
    it('should allow dealer to discard after ordering up')
    it('should reduce dealer hand to 5 cards')
    it('should reject discard when dealer has 5 cards')
    it('should reject non-dealer discarding')
  })
  
  describe('formatTrumpSelectionForAI', () => {
    it('should show turned-up card')
    it('should show round and rules')
    it('should show bid history')
    it('should show player hand')
  })
})
```

**Integration Tests:**
```typescript
describe('Full Trump Selection Flow', () => {
  it('should complete round 1 order up')
  it('should complete round 2 call trump after all pass')
  it('should handle dealer being stuck in round 2')
  it('should transition from trump selection to playing')
})
```

### 6. Error Types

Add to `errors.ts`:
```typescript
export class InvalidBidError extends GameError {
  constructor(
    message: string,
    public readonly player: Position,
    public readonly action: TrumpBidAction
  ) {
    super(message, 'INVALID_BID');
    this.name = 'InvalidBidError';
  }
}
```

## Migration Strategy

### Breaking Changes
- `GameState` structure changes (adds `phase`, `dealer`, `trumpSelection`, `trumpCaller`)
- `createNewGame()` signature changes (adds optional `dealer` param)
- All existing tests that use `createNewGame()` will need updating

### Backwards Compatibility
For existing code/tests that just want to play without trump selection:

```typescript
// Helper function for tests
export function createGameWithTrump(
  modelIds: [string, string, string, string],
  trump: Suit,
  dealer: Position = 'north'
): GameState {
  const game = createNewGame(modelIds, dealer);
  
  // Skip trump selection by manually setting state
  return {
    ...game,
    phase: 'playing',
    trump,
    trumpCaller: dealer,
    trumpSelection: undefined,
  };
}
```

All existing tests can use `createGameWithTrump()` instead of:
```typescript
let game = createNewGame(...)
game = setTrump(game, 'hearts')
```

## Questions for User

1. **Going Alone:** Include in MVP or defer to later?
   - MVP: Just the basic alone option (no bonus scoring yet)
   - Later: Full 4-point bonus and partner sitting out
   - **Recommended:** Defer to post-MVP (simpler, still strategic)

2. **Dealer Rotation:** Should `createNewGame()` support dealer rotation for multiple hands?
   - Option A: Manual - caller specifies dealer each time
   - Option B: Auto - track hand number and rotate automatically
   - **Recommended:** Manual for now (simpler API)

3. **UI Integration:** Should trump selection be interactive (user clicks) or automatic (AI decides)?
   - Per PRD, this is AI vs AI, so automatic is fine
   - But for experimentation mode, might want to override AI decisions
   - **Recommended:** Start with automatic, add override later

4. **Kitty Cards:** Should we track the 3 unused cards?
   - Pro: Complete game state, could show in UI
   - Con: Not needed for gameplay
   - **Recommended:** Add to state for completeness

## Summary

**Approach:** Option A - Add proper phase management to GameState

**Core Changes:**
- Add `GamePhase` type and phase tracking
- Add `TrumpSelectionState` for bidding
- Add `dealer` to game state
- Add `makeTrumpBid()` function for bidding
- Add `dealerDiscard()` for dealer after order-up
- Add comprehensive tests

**Migration:**
- Use `createGameWithTrump()` helper for existing tests
- Update all test files to handle new structure

**Timeline Estimate:**
- Type definitions: 30 min
- Core functions: 2-3 hours
- Tests: 2-3 hours
- Test migration: 1 hour
- **Total: 6-7 hours**

This gives us proper Euchre trump selection with all the strategic depth, while keeping the code clean and testable!
