export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "9" | "10" | "jack" | "queen" | "king" | "ace";
export type Position = "north" | "east" | "south" | "west";

export type GamePhase = "trump_selection" | "playing" | "complete";

export type TrumpBidAction = "order_up" | "call_trump" | "pass";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  position: Position;
  team: 0 | 1;
  hand: Card[];
  modelId: string;
}

export interface CardPlay {
  player: Position;
  card: Card;
  reasoning?: string;
}

export interface Trick {
  leadPlayer: Position;
  plays: CardPlay[];
  winner?: Position;
}

export interface TrumpBid {
  player: Position;
  action: TrumpBidAction;
  suit?: Suit; // Only for call_trump
  goingAlone?: boolean;
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
  dealer: Position;
  trumpCaller?: Position;
  goingAlone?: Position; // Player going alone (partner sits out)
  trumpSelection?: TrumpSelectionState; // Only present during trump_selection phase
  kitty: Card[]; // Unused cards (3 cards after dealing and turning up one)
  currentTrick: Trick;
  completedTricks: Trick[];
  scores: [number, number];
}
