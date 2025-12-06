import { describe, it, expect } from 'vitest';
import {
  calculateDecisionScore,
  createInitialPerformance,
  updatePerformance,
  calculateCalibrationAccuracy,
  getCalibrationAssessment,
  type DecisionOutcome,
} from '../calibration';

describe('calculateDecisionScore', () => {
  describe('high confidence decisions', () => {
    it('rewards high confidence correct decisions', () => {
      const outcome: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(3);
      expect(score.calibrationBonus).toBe(0);
      expect(score.toolCost).toBe(0);
      expect(score.totalScore).toBe(3);
    });

    it('penalizes high confidence wrong decisions', () => {
      const outcome: DecisionOutcome = {
        confidence: 90,
        toolUsed: null,
        wasCorrect: false,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(0);
      expect(score.calibrationBonus).toBe(-2);
      expect(score.totalScore).toBe(-2);
      expect(score.feedback).toContain('Overconfident');
    });
  });

  describe('medium confidence decisions', () => {
    it('gives moderate reward for medium confidence correct', () => {
      const outcome: DecisionOutcome = {
        confidence: 55,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(2);
      expect(score.totalScore).toBe(2);
    });

    it('gives small penalty for medium confidence wrong', () => {
      const outcome: DecisionOutcome = {
        confidence: 50,
        toolUsed: null,
        wasCorrect: false,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.calibrationBonus).toBe(-1);
      expect(score.totalScore).toBe(-1);
    });
  });

  describe('low confidence decisions', () => {
    it('gives small reward for low confidence correct', () => {
      const outcome: DecisionOutcome = {
        confidence: 25,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(1);
      expect(score.totalScore).toBe(1);
    });

    it('gives no penalty for low confidence wrong', () => {
      const outcome: DecisionOutcome = {
        confidence: 20,
        toolUsed: null,
        wasCorrect: false,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.totalScore).toBe(0);
      expect(score.feedback).toContain('appropriately uncertain');
    });
  });

  describe('tool usage', () => {
    it('deducts tool cost from score', () => {
      const outcome: DecisionOutcome = {
        confidence: 50,
        toolUsed: { tool: 'ask_audience', cost: 2 },
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.toolCost).toBe(2);
      expect(score.totalScore).toBe(0); // 2 base - 2 cost
    });

    it('rewards smart tool usage (low confidence + tool + correct)', () => {
      const outcome: DecisionOutcome = {
        confidence: 30,
        toolUsed: { tool: 'ask_audience', cost: 2 },
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      // 1 base + 1 smart bonus - 2 cost = 0
      expect(score.calibrationBonus).toBe(1);
      expect(score.totalScore).toBe(0);
      expect(score.feedback).toContain('Smart tool usage');
    });
  });
});

describe('performance tracking', () => {
  it('creates initial performance state', () => {
    const perf = createInitialPerformance('openai/gpt-4o', 'north');

    expect(perf.modelId).toBe('openai/gpt-4o');
    expect(perf.position).toBe('north');
    expect(perf.totalDecisions).toBe(0);
    expect(perf.totalScore).toBe(0);
  });

  it('updates performance with decision outcomes', () => {
    let perf = createInitialPerformance('openai/gpt-4o', 'north');

    const outcome: DecisionOutcome = {
      confidence: 80,
      toolUsed: null,
      wasCorrect: true,
    };
    const score = calculateDecisionScore(outcome);

    perf = updatePerformance(perf, outcome, score);

    expect(perf.totalDecisions).toBe(1);
    expect(perf.correctDecisions).toBe(1);
    expect(perf.highConfidenceCorrect).toBe(1);
    expect(perf.totalScore).toBe(3);
  });

  it('tracks tool usage', () => {
    let perf = createInitialPerformance('openai/gpt-4o', 'north');

    const outcome: DecisionOutcome = {
      confidence: 50,
      toolUsed: { tool: 'ask_audience', cost: 2 },
      wasCorrect: true,
    };
    const score = calculateDecisionScore(outcome);

    perf = updatePerformance(perf, outcome, score);

    expect(perf.toolsUsed).toBe(1);
    expect(perf.toolCostTotal).toBe(2);
  });
});

describe('calibration accuracy', () => {
  it('returns 0 for no decisions', () => {
    const perf = createInitialPerformance('test', 'north');
    expect(calculateCalibrationAccuracy(perf)).toBe(0);
  });

  it('returns high score for well-calibrated agent', () => {
    let perf = createInitialPerformance('test', 'north');

    // Simulate 70% confidence, 70% accuracy (well calibrated)
    for (let i = 0; i < 7; i++) {
      const outcome: DecisionOutcome = { confidence: 70, toolUsed: null, wasCorrect: true };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }
    for (let i = 0; i < 3; i++) {
      const outcome: DecisionOutcome = { confidence: 70, toolUsed: null, wasCorrect: false };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }

    const accuracy = calculateCalibrationAccuracy(perf);
    expect(accuracy).toBe(100); // Perfect calibration
  });

  it('returns lower score for overconfident agent', () => {
    let perf = createInitialPerformance('test', 'north');

    // Simulate 90% confidence but only 50% accuracy
    for (let i = 0; i < 5; i++) {
      const outcome: DecisionOutcome = { confidence: 90, toolUsed: null, wasCorrect: true };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }
    for (let i = 0; i < 5; i++) {
      const outcome: DecisionOutcome = { confidence: 90, toolUsed: null, wasCorrect: false };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }

    const accuracy = calculateCalibrationAccuracy(perf);
    expect(accuracy).toBe(60); // 100 - 40 error
  });
});

describe('calibration assessment', () => {
  it('returns not enough decisions for < 3 decisions', () => {
    const perf = createInitialPerformance('test', 'north');
    expect(getCalibrationAssessment(perf)).toBe('Not enough decisions yet');
  });

  it('identifies overconfidence', () => {
    let perf = createInitialPerformance('test', 'north');

    // 90% confidence, 0% accuracy
    for (let i = 0; i < 5; i++) {
      const outcome: DecisionOutcome = { confidence: 90, toolUsed: null, wasCorrect: false };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }

    expect(getCalibrationAssessment(perf)).toContain('Overconfident');
  });

  it('identifies underconfidence', () => {
    let perf = createInitialPerformance('test', 'north');

    // 30% confidence, 100% accuracy
    for (let i = 0; i < 5; i++) {
      const outcome: DecisionOutcome = { confidence: 30, toolUsed: null, wasCorrect: true };
      const score = calculateDecisionScore(outcome);
      perf = updatePerformance(perf, outcome, score);
    }

    expect(getCalibrationAssessment(perf)).toContain('Underconfident');
  });
});

describe('weighted trump decision scoring', () => {
  describe('trump call weighting', () => {
    it('weights trump calls 3x higher than card plays', () => {
      const cardPlay: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'card_play',
      };

      const trumpCall: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_call',
        pointsScored: 1, // Made the bid
      };

      const cardScore = calculateDecisionScore(cardPlay);
      const trumpScore = calculateDecisionScore(trumpCall);

      expect(cardScore.totalScore).toBe(3); // Base score
      expect(trumpScore.totalScore).toBe(9); // 3x weight
    });

    it('applies 2x bonus for loner march', () => {
      const lonerMarch: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_call',
        pointsScored: 4, // Loner march
      };

      const score = calculateDecisionScore(lonerMarch);

      // 3 base * 3 (trump weight) * 2 (loner bonus) = 18
      expect(score.totalScore).toBe(18);
      expect(score.feedback).toContain('Loner march');
    });

    it('applies 1.5x bonus for regular march', () => {
      const march: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_call',
        pointsScored: 2, // March
      };

      const score = calculateDecisionScore(march);

      // 3 base * 3 (trump weight) * 1.5 (march bonus) = 13.5 -> 14 rounded
      expect(score.totalScore).toBe(14);
      expect(score.feedback).toContain('March');
    });

    it('applies 2x penalty for getting euchred', () => {
      const euchred: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: false, // Got euchred
        decisionType: 'trump_call',
        pointsScored: -2,
      };

      const score = calculateDecisionScore(euchred);

      // -2 calibration * 3 (trump weight) * 2 (euchre penalty) = -12
      expect(score.totalScore).toBe(-12);
      expect(score.feedback).toContain('Euchred');
    });
  });

  describe('trump pass weighting', () => {
    it('weights trump passes at 0.5x', () => {
      const trumpPass: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_pass',
      };

      const score = calculateDecisionScore(trumpPass);

      // 3 base * 0.5 (pass weight) = 1.5 -> 2 rounded
      expect(score.totalScore).toBe(2);
    });
  });
});

describe('boundary value tests', () => {
  describe('confidence threshold boundaries', () => {
    it('treats confidence of exactly 70 as high confidence (correct)', () => {
      const outcome: DecisionOutcome = {
        confidence: 70,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(3); // High confidence correct
      expect(score.totalScore).toBe(3);
    });

    it('treats confidence of exactly 70 as high confidence (wrong)', () => {
      const outcome: DecisionOutcome = {
        confidence: 70,
        toolUsed: null,
        wasCorrect: false,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.calibrationBonus).toBe(-2); // High confidence wrong penalty
      expect(score.totalScore).toBe(-2);
    });

    it('treats confidence of 69 as medium confidence', () => {
      const outcome: DecisionOutcome = {
        confidence: 69,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(2); // Medium confidence correct
    });

    it('treats confidence of exactly 40 as medium confidence (not low)', () => {
      const outcome: DecisionOutcome = {
        confidence: 40,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(2); // Medium confidence correct
    });

    it('treats confidence of 39 as low confidence', () => {
      const outcome: DecisionOutcome = {
        confidence: 39,
        toolUsed: null,
        wasCorrect: true,
      };

      const score = calculateDecisionScore(outcome);

      expect(score.baseScore).toBe(1); // Low confidence correct
    });
  });

  describe('calibration accuracy edge cases', () => {
    it('returns 100 when confidence exactly matches accuracy', () => {
      let perf = createInitialPerformance('test', 'north');

      // 80% confidence, 80% accuracy = perfect calibration
      for (let i = 0; i < 8; i++) {
        const outcome: DecisionOutcome = { confidence: 80, toolUsed: null, wasCorrect: true };
        const score = calculateDecisionScore(outcome);
        perf = updatePerformance(perf, outcome, score);
      }
      for (let i = 0; i < 2; i++) {
        const outcome: DecisionOutcome = { confidence: 80, toolUsed: null, wasCorrect: false };
        const score = calculateDecisionScore(outcome);
        perf = updatePerformance(perf, outcome, score);
      }

      expect(calculateCalibrationAccuracy(perf)).toBe(100);
    });

    it('returns 0 for extreme miscalibration (100% confidence, 0% accuracy)', () => {
      let perf = createInitialPerformance('test', 'north');

      // 100% confidence, 0% accuracy
      for (let i = 0; i < 5; i++) {
        const outcome: DecisionOutcome = { confidence: 100, toolUsed: null, wasCorrect: false };
        const score = calculateDecisionScore(outcome);
        perf = updatePerformance(perf, outcome, score);
      }

      expect(calculateCalibrationAccuracy(perf)).toBe(0);
    });
  });

  describe('calibration assessment ranges', () => {
    it('returns "Good calibration" for calibration between 70-89', () => {
      let perf = createInitialPerformance('test', 'north');

      // 60% confidence, 75% accuracy = 15% error = 85% calibration score
      for (let i = 0; i < 3; i++) {
        const outcome: DecisionOutcome = { confidence: 60, toolUsed: null, wasCorrect: true };
        const score = calculateDecisionScore(outcome);
        perf = updatePerformance(perf, outcome, score);
      }
      for (let i = 0; i < 1; i++) {
        const outcome: DecisionOutcome = { confidence: 60, toolUsed: null, wasCorrect: false };
        const score = calculateDecisionScore(outcome);
        perf = updatePerformance(perf, outcome, score);
      }

      expect(getCalibrationAssessment(perf)).toBe('Good calibration');
    });
  });

  describe('medium confidence with trump call', () => {
    it('applies 3x weight to medium confidence wrong trump call', () => {
      const outcome: DecisionOutcome = {
        confidence: 50,
        toolUsed: null,
        wasCorrect: false,
        decisionType: 'trump_call',
        pointsScored: 1,
      };

      const score = calculateDecisionScore(outcome);

      // -1 calibration * 3 (trump weight) = -3
      expect(score.calibrationBonus).toBe(-3);
      expect(score.totalScore).toBe(-3);
    });
  });

  describe('undefined pointsScored', () => {
    it('uses default multiplier of 1 when pointsScored is undefined', () => {
      const outcome: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_call',
        // pointsScored is undefined
      };

      const score = calculateDecisionScore(outcome);

      // 3 base * 3 (trump weight) * 1 (default multiplier) = 9
      expect(score.totalScore).toBe(9);
    });

    it('uses default multiplier for unexpected pointsScored value', () => {
      const outcome: DecisionOutcome = {
        confidence: 85,
        toolUsed: null,
        wasCorrect: true,
        decisionType: 'trump_call',
        pointsScored: 3, // Not a valid points value
      };

      const score = calculateDecisionScore(outcome);

      // 3 base * 3 (trump weight) * 1 (default multiplier) = 9
      expect(score.totalScore).toBe(9);
    });
  });
});
