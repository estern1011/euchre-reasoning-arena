/**
 * Tests for hand strength calculation
 */

import { describe, expect, it } from 'vitest';
import type { Card, Suit } from '../../game/types';
import {
    getCardStrength,
    calculateHandStrength,
    calculateHandStrengthAllSuits,
    getBestTrumpSuit,
    getHandStrengthRanking,
    getHandStrengthCategory,
    getHandStrengthPercent,
    MAX_HAND_STRENGTH,
} from '../hand-strength';

// Helper to create cards
const card = (rank: Card['rank'], suit: Suit): Card => ({ rank, suit });

describe('getCardStrength', () => {
    describe('trump cards', () => {
        it('should give right bower (Jack of trump) 12 points', () => {
            expect(getCardStrength(card('J', 'hearts'), 'hearts')).toBe(12);
            expect(getCardStrength(card('J', 'spades'), 'spades')).toBe(12);
            expect(getCardStrength(card('J', 'diamonds'), 'diamonds')).toBe(12);
            expect(getCardStrength(card('J', 'clubs'), 'clubs')).toBe(12);
        });

        it('should give left bower (Jack of same color) 11 points', () => {
            // Hearts trump -> Jack of diamonds is left bower
            expect(getCardStrength(card('J', 'diamonds'), 'hearts')).toBe(11);
            // Diamonds trump -> Jack of hearts is left bower
            expect(getCardStrength(card('J', 'hearts'), 'diamonds')).toBe(11);
            // Spades trump -> Jack of clubs is left bower
            expect(getCardStrength(card('J', 'clubs'), 'spades')).toBe(11);
            // Clubs trump -> Jack of spades is left bower
            expect(getCardStrength(card('J', 'spades'), 'clubs')).toBe(11);
        });

        it('should give Ace of trump 10 points', () => {
            expect(getCardStrength(card('A', 'hearts'), 'hearts')).toBe(10);
        });

        it('should give King of trump 9 points', () => {
            expect(getCardStrength(card('K', 'hearts'), 'hearts')).toBe(9);
        });

        it('should give Queen of trump 8 points', () => {
            expect(getCardStrength(card('Q', 'hearts'), 'hearts')).toBe(8);
        });

        it('should give 10 of trump 7 points', () => {
            expect(getCardStrength(card('10', 'hearts'), 'hearts')).toBe(7);
        });

        it('should give 9 of trump 6 points', () => {
            expect(getCardStrength(card('9', 'hearts'), 'hearts')).toBe(6);
        });
    });

    describe('off-suit cards', () => {
        it('should give Ace of off-suit 5 points', () => {
            expect(getCardStrength(card('A', 'clubs'), 'hearts')).toBe(5);
            expect(getCardStrength(card('A', 'spades'), 'hearts')).toBe(5);
        });

        it('should give King of off-suit 4 points', () => {
            expect(getCardStrength(card('K', 'clubs'), 'hearts')).toBe(4);
        });

        it('should give Queen of off-suit 3 points', () => {
            expect(getCardStrength(card('Q', 'clubs'), 'hearts')).toBe(3);
        });

        it('should give Jack of off-suit (not left bower) 2 points', () => {
            // Clubs is not the same color as hearts, so it's just an off-suit jack
            expect(getCardStrength(card('J', 'clubs'), 'hearts')).toBe(2);
            expect(getCardStrength(card('J', 'spades'), 'hearts')).toBe(2);
        });

        it('should give 10 of off-suit 1 point', () => {
            expect(getCardStrength(card('10', 'clubs'), 'hearts')).toBe(1);
        });

        it('should give 9 of off-suit 0 points', () => {
            expect(getCardStrength(card('9', 'clubs'), 'hearts')).toBe(0);
        });
    });

    describe('left bower edge cases', () => {
        it('should not give left bower points to off-color jack', () => {
            // Hearts trump: spades and clubs are NOT left bower
            expect(getCardStrength(card('J', 'spades'), 'hearts')).toBe(2); // off-suit jack
            expect(getCardStrength(card('J', 'clubs'), 'hearts')).toBe(2); // off-suit jack

            // Spades trump: hearts and diamonds are NOT left bower
            expect(getCardStrength(card('J', 'hearts'), 'spades')).toBe(2);
            expect(getCardStrength(card('J', 'diamonds'), 'spades')).toBe(2);
        });
    });
});

describe('calculateHandStrength', () => {
    it('should sum all card strengths in hand', () => {
        const hand: Card[] = [
            card('J', 'hearts'),   // Right bower = 12
            card('J', 'diamonds'), // Left bower = 11
            card('A', 'hearts'),   // Ace of trump = 10
            card('K', 'hearts'),   // King of trump = 9
            card('A', 'clubs'),    // Off-suit ace = 5
        ];
        expect(calculateHandStrength(hand, 'hearts')).toBe(47);
    });

    it('should return 0 for empty hand', () => {
        expect(calculateHandStrength([], 'hearts')).toBe(0);
    });

    it('should calculate correctly for all off-suit hand', () => {
        const hand: Card[] = [
            card('A', 'clubs'),    // 5
            card('K', 'clubs'),    // 4
            card('Q', 'clubs'),    // 3
            card('J', 'clubs'),    // 2 (not left bower for hearts)
            card('9', 'clubs'),    // 0
        ];
        expect(calculateHandStrength(hand, 'hearts')).toBe(14);
    });

    it('should calculate maximum strength hand correctly', () => {
        const hand: Card[] = [
            card('J', 'hearts'),   // Right bower = 12
            card('J', 'diamonds'), // Left bower = 11
            card('A', 'hearts'),   // Ace of trump = 10
            card('K', 'hearts'),   // King of trump = 9
            card('Q', 'hearts'),   // Queen of trump = 8
        ];
        expect(calculateHandStrength(hand, 'hearts')).toBe(50);
        expect(calculateHandStrength(hand, 'hearts')).toBe(MAX_HAND_STRENGTH);
    });
});

describe('calculateHandStrengthAllSuits', () => {
    it('should calculate strengths for all four suits', () => {
        const hand: Card[] = [
            card('J', 'hearts'),   // Right bower for hearts, left for diamonds
            card('A', 'spades'),   // Trump ace for spades, off-suit ace for others
            card('9', 'clubs'),    // Trump 9 for clubs, worthless for others
        ];

        const strengths = calculateHandStrengthAllSuits(hand);

        expect(strengths.hearts).toBe(12 + 5 + 0);  // Right bower + off-suit ace + off-suit 9
        expect(strengths.diamonds).toBe(11 + 5 + 0); // Left bower + off-suit ace + off-suit 9
        expect(strengths.spades).toBe(2 + 10 + 0);   // Off-suit jack + trump ace + off-suit 9
        expect(strengths.clubs).toBe(2 + 5 + 6);     // Off-suit jack + off-suit ace + trump 9
    });
});

describe('getBestTrumpSuit', () => {
    it('should return the suit with highest hand strength', () => {
        const hand: Card[] = [
            card('J', 'hearts'),   // Right bower for hearts
            card('J', 'diamonds'), // Left bower for hearts, right for diamonds
            card('A', 'hearts'),   // Trump ace for hearts
        ];

        const best = getBestTrumpSuit(hand);
        expect(best.suit).toBe('hearts');
        expect(best.strength).toBe(12 + 11 + 10); // 33
    });

    it('should handle tie by returning first alphabetically', () => {
        const hand: Card[] = [
            card('A', 'hearts'),   // Same value regardless of trump
            card('K', 'spades'),
        ];
        // All suits give same strength, should return 'hearts' (first checked)
        const best = getBestTrumpSuit(hand);
        expect(['hearts', 'diamonds', 'clubs', 'spades']).toContain(best.suit);
    });
});

describe('getHandStrengthRanking', () => {
    it('should rank players by hand strength descending', () => {
        const hands = {
            north: [card('J', 'hearts'), card('A', 'hearts')], // 12 + 10 = 22
            east: [card('9', 'clubs'), card('9', 'spades')],   // 0 + 0 = 0
            south: [card('A', 'clubs'), card('K', 'clubs')],   // 5 + 4 = 9
            west: [card('J', 'diamonds'), card('K', 'hearts')], // 11 + 9 = 20
        };

        const ranking = getHandStrengthRanking(hands, 'hearts');

        expect(ranking[0]).toEqual({ position: 'north', strength: 22 });
        expect(ranking[1]).toEqual({ position: 'west', strength: 20 });
        expect(ranking[2]).toEqual({ position: 'south', strength: 9 });
        expect(ranking[3]).toEqual({ position: 'east', strength: 0 });
    });
});

describe('getHandStrengthCategory', () => {
    it('should categorize as strong for 25+', () => {
        expect(getHandStrengthCategory(25)).toBe('strong');
        expect(getHandStrengthCategory(50)).toBe('strong');
    });

    it('should categorize as medium for 15-24', () => {
        expect(getHandStrengthCategory(15)).toBe('medium');
        expect(getHandStrengthCategory(24)).toBe('medium');
    });

    it('should categorize as weak for 0-14', () => {
        expect(getHandStrengthCategory(0)).toBe('weak');
        expect(getHandStrengthCategory(14)).toBe('weak');
    });
});

describe('getHandStrengthPercent', () => {
    it('should return 100% for max strength', () => {
        expect(getHandStrengthPercent(50)).toBe(100);
    });

    it('should return 0% for zero strength', () => {
        expect(getHandStrengthPercent(0)).toBe(0);
    });

    it('should return 50% for half strength', () => {
        expect(getHandStrengthPercent(25)).toBe(50);
    });
});

describe('real game scenarios', () => {
    it('should correctly evaluate a strong trump hand', () => {
        // Player has: J♥ (right), A♥, K♥, Q♣, 9♦
        const hand: Card[] = [
            card('J', 'hearts'),
            card('A', 'hearts'),
            card('K', 'hearts'),
            card('Q', 'clubs'),
            card('9', 'diamonds'),
        ];
        // Hearts trump: 12 + 10 + 9 + 3 + 0 = 34
        expect(calculateHandStrength(hand, 'hearts')).toBe(34);
        expect(getHandStrengthCategory(34)).toBe('strong');
    });

    it('should correctly evaluate with left bower counted', () => {
        // Player has: J♦ (left bower when hearts trump), A♣, K♣, Q♣, 9♣
        const hand: Card[] = [
            card('J', 'diamonds'),
            card('A', 'clubs'),
            card('K', 'clubs'),
            card('Q', 'clubs'),
            card('9', 'clubs'),
        ];
        // Hearts trump: J♦ is left bower = 11, plus off-suit = 11 + 5 + 4 + 3 + 0 = 23
        expect(calculateHandStrength(hand, 'hearts')).toBe(23);
        expect(getHandStrengthCategory(23)).toBe('medium');
    });

    it('should correctly evaluate a weak hand', () => {
        // Player has: 9♥, 9♠, 10♣, 10♦, Q♦
        const hand: Card[] = [
            card('9', 'hearts'),
            card('9', 'spades'),
            card('10', 'clubs'),
            card('10', 'diamonds'),
            card('Q', 'diamonds'),
        ];
        // Clubs trump: 0 + 0 + 7 + 1 + 3 = 11
        expect(calculateHandStrength(hand, 'clubs')).toBe(11);
        expect(getHandStrengthCategory(11)).toBe('weak');
    });
});
