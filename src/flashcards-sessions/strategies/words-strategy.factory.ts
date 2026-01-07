import { Injectable, Logger } from '@nestjs/common';
import { INewWordsStrategy } from './new-words-strategy.interface';
import { RandomWordsStrategy } from './random-words.strategy';
import { LevelWordsStrategy } from './level-words.strategy';

/**
 * Factory for selecting word selection strategies in flashcard sessions.
 * 
 * Provides centralized strategy resolution based on session type.
 * Supports extensible strategy mapping for adding new strategies.
 * 
 * @example
 * ```ts
 * const factory = new WordsStrategyFactory(randomStrategy, levelStrategy);
 * const strategy = factory.getStrategy('level_a1_a2');
 * ```
 */
@Injectable()
export class WordsStrategyFactory {
  private readonly logger = new Logger(WordsStrategyFactory.name);
  private readonly defaultStrategy: INewWordsStrategy;

  private readonly STRATEGY_TYPES = {
    RANDOM: 'random',
    LEVEL_PREFIX: 'level_',
  } as const;

  constructor(
    private readonly randomStrategy: RandomWordsStrategy,
    private readonly levelStrategy: LevelWordsStrategy,
  ) {
    this.defaultStrategy = this.randomStrategy;
  }

  /**
   * Returns appropriate strategy instance based on session type.
   * 
   * Resolution priority:
   * 1. Null/empty/whitespace → default (random) strategy
   * 2. 'random' → random strategy
   * 3. 'level_*' → level-based strategy
   * 4. Unknown types → default strategy (with warning log)
   *
   * @param type - Session type string (e.g., 'random', 'level_a1_a2')
   * @returns Strategy instance implementing INewWordsStrategy
   * @throws Never throws - always returns a valid strategy
   *
   * @example
   * ```ts
   * const randomStrat = factory.getStrategy('random');
   * const levelStrat = factory.getStrategy('level_b1_b2');
   * const defaultStrat = factory.getStrategy(null); // returns random strategy
   * ```
   */
  getStrategy(type?: string): INewWordsStrategy {
    if (!type?.trim()) {
      this.logger.debug('No strategy type provided, using default strategy');
      return this.defaultStrategy;
    }

    const normalized = this.normalizeType(type);
    const strategy = this.resolveStrategy(normalized, type);

    this.logger.debug(`Strategy resolved: "${type}" → ${strategy.constructor.name}`);

    return strategy;
  }

  /**
   * Resolves strategy from normalized type string.
   * Internal routing logic for strategy selection.
   *
   * @param normalized - Normalized (lowercase, trimmed) strategy type
   * @param original - Original strategy type string (for logging)
   * @returns Resolved strategy instance
   */
  private resolveStrategy(normalized: string, original: string): INewWordsStrategy {
    switch (normalized) {
      case this.STRATEGY_TYPES.RANDOM:
        return this.randomStrategy;

      case normalized.startsWith(this.STRATEGY_TYPES.LEVEL_PREFIX) ? normalized : null:
        return this.levelStrategy;

      default:
        this.logger.warn(
          `Unknown strategy type: "${original}". Falling back to default (random) strategy. ` +
          `Supported types: 'random', 'level_*' (e.g., 'level_a1_a2').`
        );
        return this.defaultStrategy;
    }
  }

  /**
   * Normalizes strategy type string for consistent matching.
   * 
   * Transformations applied:
   * - Convert to lowercase
   * - Trim whitespace
   *
   * @param type - Raw strategy type string
   * @returns Normalized lowercase string without extra whitespace
   */
  private normalizeType(type: string): string {
    return type.toLowerCase().trim();
  }
}
