/**
 * Hand Strength Calculation
 *
 * Calculates a deterministic score for each player's hand
 * relative to a potential trump suit.
 */

import type { Card, Suit, Position } from '../game/types';

/**
 * Point values for cards relative to trump suit
 *
 * TRUMP CARDS:
 *   Right Bower (Jack of trump)     = 12 pts
 *   Left Bower (Jack of same color) = 11 pts
 *   Ace of trump                    = 10 pts
 *   King of trump                   = 9 pts
 *   Queen of trump                  = 8 pts
 *   10 of trump                     = 7 pts
 *   9 of trump                      = 6 pts
 *
 * OFF-SUIT CARDS:
 *   Ace                             = 5 pts
 *   King                            = 4 pts
 *   Queen                           = 3 pts
 *   Jack                            = 2 pts
 *   10                              = 1 pt
 *   9                               = 0 pts
 */

const TRUMP_POINTS: Record<string, number> = {
    'jack_right': 12,  // Right bower
    'jack_left': 11,   // Left bower
    'ace': 10,
    'king': 9,
    'queen': 8,
    '10': 7,
    '9': 6,
};

const OFF_SUIT_POINTS: Record<string, number> = {
    'ace': 5,
    'king': 4,
    'queen': 3,
    'jack': 2,
    '10': 1,
    '9': 0,
};

/**
 * Get the "same color" suit for left bower calculation
 */
function getLeftBowerSuit(trumpSuit: Suit): Suit {
    const sameColor: Record<Suit, Suit> = {
        'hearts': 'diamonds',
        'diamonds': 'hearts',
        'clubs': 'spades',
        'spades': 'clubs',
    };
    return sameColor[trumpSuit];
}

/**
 * Calculate the strength of a single card given a trump suit
 */
export function getCardStrength(card: Card, trumpSuit: Suit): number {
    const leftBowerSuit = getLeftBowerSuit(trumpSuit);

    // Right bower - Jack of trump suit
    if (card.suit === trumpSuit && card.rank === 'jack') {
        return TRUMP_POINTS['jack_right'] ?? 0;
    }

    // Left bower - Jack of same color suit
    if (card.suit === leftBowerSuit && card.rank === 'jack') {
        return TRUMP_POINTS['jack_left'] ?? 0;
    }

    // Other trump cards
    if (card.suit === trumpSuit) {
        return TRUMP_POINTS[card.rank] ?? 0;
    }

    // Off-suit cards
    return OFF_SUIT_POINTS[card.rank] ?? 0;
}

/**
 * Calculate total hand strength for a given trump suit
 */
export function calculateHandStrength(hand: Card[], trumpSuit: Suit): number {
    return hand.reduce((total, card) => total + getCardStrength(card, trumpSuit), 0);
}

/**
 * Calculate hand strength for all possible trump suits
 */
export function calculateHandStrengthAllSuits(hand: Card[]): Record<Suit, number> {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const strengths: Record<Suit, number> = {
        hearts: 0,
        diamonds: 0,
        clubs: 0,
        spades: 0,
    };

    for (const suit of suits) {
        strengths[suit] = calculateHandStrength(hand, suit);
    }

    return strengths;
}

/**
 * Get the best trump suit for a hand
 */
export function getBestTrumpSuit(hand: Card[]): { suit: Suit; strength: number } {
    const strengths = calculateHandStrengthAllSuits(hand);
    let bestSuit: Suit = 'hearts';
    let bestStrength = 0;

    for (const [suit, strength] of Object.entries(strengths)) {
        if (strength > bestStrength) {
            bestStrength = strength;
            bestSuit = suit as Suit;
        }
    }

    return { suit: bestSuit, strength: bestStrength };
}

/**
 * Calculate hand strengths for all players given a trump suit
 */
export function calculateAllHandStrengths(
    hands: Record<Position, Card[]>,
    trumpSuit: Suit
): Record<Position, number> {
    const positions: Position[] = ['north', 'east', 'south', 'west'];
    const strengths: Record<Position, number> = {
        north: 0,
        east: 0,
        south: 0,
        west: 0,
    };

    for (const pos of positions) {
        if (hands[pos]) {
            strengths[pos] = calculateHandStrength(hands[pos], trumpSuit);
        }
    }

    return strengths;
}

/**
 * Calculate hand strength matrix for all players × all suits
 * Used in Round 2 when any suit can be called
 */
export function calculateHandStrengthMatrix(
    hands: Record<Position, Card[]>
): Record<Position, Record<Suit, number>> {
    const positions: Position[] = ['north', 'east', 'south', 'west'];
    const matrix: Record<Position, Record<Suit, number>> = {
        north: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        east: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        south: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        west: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
    };

    for (const pos of positions) {
        if (hands[pos]) {
            matrix[pos] = calculateHandStrengthAllSuits(hands[pos]);
        }
    }

    return matrix;
}

/**
 * Get hand strength ranking (sorted by strength descending)
 */
export function getHandStrengthRanking(
    hands: Record<Position, Card[]>,
    trumpSuit: Suit
): Array<{ position: Position; strength: number }> {
    const strengths = calculateAllHandStrengths(hands, trumpSuit);

    return Object.entries(strengths)
        .map(([position, strength]) => ({ position: position as Position, strength }))
        .sort((a, b) => b.strength - a.strength);
}

/**
 * Interpret hand strength as a category
 */
export function getHandStrengthCategory(strength: number): 'strong' | 'medium' | 'weak' {
    if (strength >= 25) return 'strong';
    if (strength >= 15) return 'medium';
    return 'weak';
}

/**
 * Maximum possible hand strength (all top trump)
 * Right bower (12) + Left bower (11) + Ace (10) + King (9) + Queen (8) = 50
 */
export const MAX_HAND_STRENGTH = 50;

/**
 * Get hand strength as a percentage of maximum
 */
export function getHandStrengthPercent(strength: number): number {
    return Math.round((strength / MAX_HAND_STRENGTH) * 100);
}
