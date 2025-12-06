/**
 * Metacognition Arena - Calibration Scoring System
 *
 * Scores agents based on:
 * 1. Confidence calibration (did confidence match outcome?)
 * 2. Tool usage efficiency (did tools help? was cost worth it?)
 * 3. Decision correctness (did the play/bid succeed?)
 */

export interface DecisionOutcome {
  confidence: number; // 0-100
  toolUsed: { tool: string; cost: number } | null;
  wasCorrect: boolean; // Did the decision lead to a good outcome?
  decisionType?: 'card_play' | 'trump_call' | 'trump_pass';
  /** For trump decisions: points scored by calling team (1, 2, 4) or -2 if euchred */
  pointsScored?: number;
}

export interface DecisionScore {
  baseScore: number;      // Points from decision correctness
  calibrationBonus: number; // Bonus/penalty for confidence calibration
  toolCost: number;       // Points deducted for tool usage
  totalScore: number;     // Final score for this decision
  feedback: string;       // Human-readable explanation
}

/**
 * Confidence thresholds for scoring
 * Exported for use in UI components
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 70,   // >= 70% is high confidence
  LOW: 40,    // < 40% is low confidence
  // 40-69% is medium confidence
} as const;

/**
 * Scoring weights for different decision types
 * Trump decisions are weighted higher because they're more consequential
 */
const DECISION_WEIGHTS = {
  card_play: 1,      // Base weight for card plays
  trump_call: 3,     // Trump calls are 3x more important
  trump_pass: 0.5,   // Passing is less consequential (but still tracked)
};

/**
 * Bonus multipliers based on points scored in a hand (for trump calls)
 * Getting euchred is very bad, march/loner is very good
 */
const POINTS_MULTIPLIERS = new Map<number, number>([
  [4, 2.0],   // Loner march - exceptional
  [2, 1.5],   // March (5 tricks) - great
  [1, 1.0],   // Made the bid - good
  [-2, 2.0],  // Got euchred - penalty doubled
]);

/**
 * Scoring table based on confidence vs correctness
 *
 * For card plays:
 * | Confidence | Correct | Points | Reason |
 * |------------|---------|--------|--------|
 * | High (≥70) | Yes     | +3     | Well-calibrated, confident and right |
 * | High (≥70) | No      | -2     | Overconfident - knew wrong answer |
 * | Med (40-69)| Yes     | +2     | Reasonable confidence, correct |
 * | Med (40-69)| No      | -1     | Acceptable uncertainty |
 * | Low (<40)  | Yes     | +1     | Underconfident but correct |
 * | Low (<40)  | No      | 0      | Appropriately uncertain |
 *
 * Trump calls are weighted 3x higher and modified by points scored.
 */
export function calculateDecisionScore(outcome: DecisionOutcome): DecisionScore {
  const { confidence, toolUsed, wasCorrect, decisionType = 'card_play', pointsScored } = outcome;

  let baseScore = 0;
  let calibrationBonus = 0;
  let feedback = '';

  const isHighConfidence = confidence >= CONFIDENCE_THRESHOLDS.HIGH;
  const isLowConfidence = confidence < CONFIDENCE_THRESHOLDS.LOW;
  const isMediumConfidence = !isHighConfidence && !isLowConfidence;

  // Get the weight for this decision type
  const weight = DECISION_WEIGHTS[decisionType] ?? 1;

  // Get points multiplier for trump calls (based on hand outcome)
  let pointsMultiplier = 1;
  if (decisionType === 'trump_call' && pointsScored !== undefined) {
    pointsMultiplier = POINTS_MULTIPLIERS.get(pointsScored) ?? 1;
  }

  if (wasCorrect) {
    if (isHighConfidence) {
      baseScore = 3;
      calibrationBonus = 0;
      feedback = 'Well-calibrated: high confidence, correct decision';
    } else if (isMediumConfidence) {
      baseScore = 2;
      calibrationBonus = 0;
      feedback = 'Good decision with reasonable confidence';
    } else {
      baseScore = 1;
      calibrationBonus = 0;
      feedback = 'Correct but underconfident - trust yourself more!';
    }
  } else {
    if (isHighConfidence) {
      baseScore = 0;
      calibrationBonus = -2;
      feedback = 'Overconfident: high confidence but wrong';
    } else if (isMediumConfidence) {
      baseScore = 0;
      calibrationBonus = -1;
      feedback = 'Incorrect decision';
    } else {
      baseScore = 0;
      calibrationBonus = 0;
      feedback = 'Wrong but appropriately uncertain';
    }
  }

  // Apply weight and points multiplier
  baseScore = Math.round(baseScore * weight * pointsMultiplier);
  calibrationBonus = Math.round(calibrationBonus * weight * pointsMultiplier);

  // Add context to feedback for trump decisions
  if (decisionType === 'trump_call') {
    if (pointsScored === 4) {
      feedback += ' (Loner march! 2x bonus)';
    } else if (pointsScored === 2) {
      feedback += ' (March! 1.5x bonus)';
    } else if (pointsScored === -2) {
      feedback += ' (Euchred! 2x penalty)';
    }
    feedback = `[TRUMP CALL 3x] ${feedback}`;
  }

  // Tool cost is always deducted
  const toolCost = toolUsed?.cost ?? 0;

  // Bonus for smart tool usage: used tool when uncertain AND it helped
  if (toolUsed && isLowConfidence && wasCorrect) {
    calibrationBonus += 1;
    feedback = 'Smart tool usage: asked for help when uncertain, got it right';
  }

  const totalScore = baseScore + calibrationBonus - toolCost;

  return {
    baseScore,
    calibrationBonus,
    toolCost,
    totalScore,
    feedback,
  };
}

/**
 * Performance tracking for a single agent
 */
export interface AgentPerformance {
  modelId: string;
  position: string;

  // Decision counts
  totalDecisions: number;
  correctDecisions: number;

  // Confidence tracking
  totalConfidence: number; // Sum of all confidences
  highConfidenceCorrect: number;
  highConfidenceWrong: number;
  lowConfidenceCorrect: number;
  lowConfidenceWrong: number;

  // Tool usage
  toolsUsed: number;
  toolCostTotal: number;

  // Scoring
  totalScore: number;
  calibrationScore: number; // Separate tracking for calibration quality
}

/**
 * Create initial performance state for an agent
 */
export function createInitialPerformance(modelId: string, position: string): AgentPerformance {
  return {
    modelId,
    position,
    totalDecisions: 0,
    correctDecisions: 0,
    totalConfidence: 0,
    highConfidenceCorrect: 0,
    highConfidenceWrong: 0,
    lowConfidenceCorrect: 0,
    lowConfidenceWrong: 0,
    toolsUsed: 0,
    toolCostTotal: 0,
    totalScore: 0,
    calibrationScore: 0,
  };
}

/**
 * Update agent performance with a new decision outcome
 */
export function updatePerformance(
  performance: AgentPerformance,
  outcome: DecisionOutcome,
  score: DecisionScore
): AgentPerformance {
  const { confidence, toolUsed, wasCorrect } = outcome;

  const isHighConfidence = confidence >= CONFIDENCE_THRESHOLDS.HIGH;
  const isLowConfidence = confidence < CONFIDENCE_THRESHOLDS.LOW;

  return {
    ...performance,
    totalDecisions: performance.totalDecisions + 1,
    correctDecisions: performance.correctDecisions + (wasCorrect ? 1 : 0),
    totalConfidence: performance.totalConfidence + confidence,
    highConfidenceCorrect: performance.highConfidenceCorrect + (isHighConfidence && wasCorrect ? 1 : 0),
    highConfidenceWrong: performance.highConfidenceWrong + (isHighConfidence && !wasCorrect ? 1 : 0),
    lowConfidenceCorrect: performance.lowConfidenceCorrect + (isLowConfidence && wasCorrect ? 1 : 0),
    lowConfidenceWrong: performance.lowConfidenceWrong + (isLowConfidence && !wasCorrect ? 1 : 0),
    toolsUsed: performance.toolsUsed + (toolUsed ? 1 : 0),
    toolCostTotal: performance.toolCostTotal + (toolUsed?.cost ?? 0),
    totalScore: performance.totalScore + score.totalScore,
    calibrationScore: performance.calibrationScore + score.calibrationBonus,
  };
}

/**
 * Calculate calibration accuracy (how well confidence matches outcomes)
 * Returns a value from 0-100 where 100 is perfectly calibrated
 */
export function calculateCalibrationAccuracy(performance: AgentPerformance): number {
  if (performance.totalDecisions === 0) return 0;

  const avgConfidence = performance.totalConfidence / performance.totalDecisions;
  const actualAccuracy = (performance.correctDecisions / performance.totalDecisions) * 100;

  // Perfect calibration means confidence matches actual accuracy
  // Deviation from this is penalized
  const calibrationError = Math.abs(avgConfidence - actualAccuracy);

  // Convert error to accuracy score (0 error = 100 score)
  return Math.max(0, 100 - calibrationError);
}

/**
 * Get a human-readable calibration assessment
 */
export function getCalibrationAssessment(performance: AgentPerformance): string {
  if (performance.totalDecisions < 3) {
    return 'Not enough decisions yet';
  }

  const calibration = calculateCalibrationAccuracy(performance);
  const avgConfidence = performance.totalConfidence / performance.totalDecisions;
  const actualAccuracy = (performance.correctDecisions / performance.totalDecisions) * 100;

  if (calibration >= 90) {
    return 'Excellent calibration - confidence matches performance';
  }

  if (avgConfidence > actualAccuracy + 15) {
    return 'Overconfident - confidence exceeds actual accuracy';
  }

  if (avgConfidence < actualAccuracy - 15) {
    return 'Underconfident - performing better than confidence suggests';
  }

  if (calibration >= 70) {
    return 'Good calibration';
  }

  return 'Needs calibration improvement';
}
