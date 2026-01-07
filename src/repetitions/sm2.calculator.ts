/**
 * SM-2 Algorithm Calculator
 *
 * Pure implementation of the SuperMemo 2 spaced repetition algorithm.
 * This calculator is stateless and can be used across the application.
 *
 * @see https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

/**
 * Input state for SM-2 calculation.
 */
export interface SM2State {
  /** Current easiness factor (minimum 1.3) */
  easinessFactor: number;
  /** Number of consecutive correct responses */
  repetitions: number;
  /** Current interval in days */
  nextInterval: number;
}

/**
 * Result of SM-2 calculation including new state and dates.
 */
export interface SM2Result extends SM2State {
  /** Date of this review */
  dateLastRep: Date;
  /** Scheduled date for next review */
  dateNextRep: Date;
  /** Suggested stage based on interval */
  stage: 'learning' | 'passed';
}

/**
 * SM-2 Algorithm constants.
 */
const SM2_CONSTANTS = {
  /** Minimum easiness factor to prevent values below database constraint */
  MIN_EASINESS_FACTOR: 1.31,
  /** Score threshold for successful recall */
  PASSING_SCORE: 3,
  /** First interval after initial successful recall (days) */
  FIRST_INTERVAL: 1,
  /** Second interval after consecutive successful recall (days) */
  SECOND_INTERVAL: 6,
} as const;

/**
 * Calculates new spaced repetition state using the SM-2 algorithm.
 *
 * Algorithm behavior:
 * - Score >= 3: Item recalled successfully, increase interval
 * - Score < 3: Item forgotten, reset to beginning
 *
 * Interval progression for successful recalls:
 * - First success: 1 day
 * - Second success: 6 days
 * - Subsequent: previous interval × easiness factor
 *
 * @param currentState - Current repetition state
 * @param score - User's recall quality rating (0-5)
 * @returns New SM-2 state with updated values and dates
 *
 * @example
 * ```ts
 * const result = calculateSM2(
 *   { easinessFactor: 2.5, repetitions: 0, nextInterval: 0 },
 *   4
 * );
 * // result.nextInterval === 1, result.stage === 'passed'
 * ```
 */
export function calculateSM2(currentState: SM2State, score: number): SM2Result {
  let { easinessFactor, repetitions, nextInterval } = currentState;

  // Calculate new interval and repetitions based on score
  if (score >= SM2_CONSTANTS.PASSING_SCORE) {
    nextInterval = calculateNextInterval(repetitions, nextInterval, easinessFactor);
    repetitions++;
  } else {
    // Failed recall - reset progression
    repetitions = 0;
    nextInterval = 0;
  }

  // Update easiness factor using SM-2 formula
  easinessFactor = calculateEasinessFactor(easinessFactor, score);

  // Calculate dates
  const { dateLastRep, dateNextRep } = calculateDates(nextInterval);

  // Determine learning stage
  const stage = determineStage(nextInterval);

  return {
    easinessFactor,
    repetitions,
    nextInterval,
    dateLastRep,
    dateNextRep,
    stage,
  };
}

/**
 * Calculates next interval based on repetition count.
 *
 * @param repetitions - Current repetition count
 * @param currentInterval - Current interval in days
 * @param easinessFactor - Current easiness factor
 * @returns New interval in days
 */
function calculateNextInterval(
  repetitions: number,
  currentInterval: number,
  easinessFactor: number,
): number {
  if (repetitions === 0) {
    return SM2_CONSTANTS.FIRST_INTERVAL;
  }

  if (repetitions === 1) {
    return SM2_CONSTANTS.SECOND_INTERVAL;
  }

  return Math.round(currentInterval * easinessFactor);
}

/**
 * Calculates new easiness factor using SM-2 formula.
 *
 * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * Where q is the quality of response (0-5).
 *
 * @param currentEF - Current easiness factor
 * @param score - Quality of response (0-5)
 * @returns New easiness factor (minimum 1.31)
 */
function calculateEasinessFactor(currentEF: number, score: number): number {
  const newEF = currentEF + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));

  // Enforce minimum to avoid database constraint issues
  return Math.max(newEF, SM2_CONSTANTS.MIN_EASINESS_FACTOR);
}

/**
 * Calculates review dates based on interval.
 *
 * @param interval - Interval in days until next review
 * @returns Object with current date and next review date
 */
function calculateDates(interval: number): { dateLastRep: Date; dateNextRep: Date } {
  const now = new Date();
  const nextDate = new Date();
  nextDate.setDate(now.getDate() + interval);

  return {
    dateLastRep: now,
    dateNextRep: nextDate,
  };
}

/**
 * Determines learning stage based on interval.
 *
 * @param interval - Current interval in days
 * @returns 'passed' if interval >= 1, 'learning' otherwise
 */
function determineStage(interval: number): 'learning' | 'passed' {
  return interval >= 1 ? 'passed' : 'learning';
}
