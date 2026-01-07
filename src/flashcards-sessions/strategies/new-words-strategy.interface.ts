import { Word } from '../../words/word.entity';

/**
 * Interface for word selection strategies in flashcard sessions.
 * Implementations define how to choose new words for learning based on session type and user context.
 */
export interface INewWordsStrategy {
  /**
   * Retrieves a list of new words for the user based on the strategy implementation.
   * Words should be unlearned (not in user's repetitions) and randomly ordered.
   *
   * @param userId - User identifier
   * @param limit - Maximum number of words to retrieve
   * @param sessionType - Session configuration type (e.g., 'random', 'level_a1_a2')
   *   determines which words subset to select from
   * @returns Promise resolving to array of Word entities
   *
   * @example
   * ```ts
   * const words = await strategy.getNewWords('user123', 10, 'level_a1_a2');
   * ```
   */
  getNewWords(userId: string, limit: number, sessionType: string): Promise<Word[]>;
}
