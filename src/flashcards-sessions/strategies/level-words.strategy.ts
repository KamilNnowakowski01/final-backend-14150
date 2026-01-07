import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../../words/word.entity';
import { INewWordsStrategy } from './new-words-strategy.interface';

/**
 * Level-based word selection strategy.
 * Selects new words filtered by CEFR language levels specified in session type.
 * Example: 'level_a1_a2' returns words matching levels A1 and A2.
 */
@Injectable()
export class LevelWordsStrategy implements INewWordsStrategy {
  private readonly logger = new Logger(LevelWordsStrategy.name);

  private readonly LEVEL_PREFIX = 'level_';
  private readonly VALID_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const;

  constructor(
    @InjectRepository(Word) private readonly wordsRepository: Repository<Word>
  ) {}

  /**
   * Retrieves unlearned words filtered by specified language levels.
   * @param userId - User identifier
   * @param limit - Number of words to retrieve
   * @param sessionType - Level specification (e.g., 'level_a1_a2', 'level_b1_b2')
   * @returns Promise resolving to array of Word entities matching specified levels
   * @throws BadRequestException if sessionType format is invalid or no valid levels found
   *
   * @example
   * ```ts
   * // Get 10 new words for A1 and A2 levels
   * const words = await strategy.getNewWords('user123', 10, 'level_a1_a2');
   * ```
   */
  async getNewWords(userId: string, limit: number, sessionType: string): Promise<Word[]> {
    const levels = this.parseLevels(sessionType);

    if (levels.length === 0) {
      this.logger.warn(
        `No valid levels extracted from sessionType: "${sessionType}"`
      );
      return [];
    }

    this.logger.debug(
      `Fetching ${limit} words for levels [${levels.join(', ')}] for user ${userId}`
    );

    try {
      return await this.wordsRepository
        .createQueryBuilder('word')
        .leftJoin('word.repetitions', 'repetition', 'repetition.userId = :userId', { userId })
        .where('repetition.id IS NULL')
        .andWhere('LOWER(word.level) IN (:...levels)', { levels })
        .orderBy('RANDOM()')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to fetch level-based words for user ${userId} and levels [${levels.join(', ')}]: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Extracts and validates language levels from session type string.
   * Expected format: 'level_a1_a2', 'level_b1_b2', etc.
   *
   * @param type - Session type string to parse
   * @returns Array of valid lowercase level codes
   *
   * @example
   * ```ts
   * parseLevels('level_a1_a2');  // ['a1', 'a2']
   * parseLevels('level_c1');     // ['c1']
   * parseLevels('random');       // []
   * ```
   */
  private parseLevels(type: string): string[] {
    if (!type || !type.toLowerCase().startsWith(this.LEVEL_PREFIX)) {
      return [];
    }

    const parts = type.toLowerCase().split('_');
    // Remove 'level' prefix
    parts.shift();

    const levels = parts
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .filter(p => this.isValidLevel(p));

    if (levels.length === 0) {
      this.logger.warn(
        `Invalid level codes in sessionType: "${type}". Valid levels are: ${this.VALID_LEVELS.join(', ')}`
      );
    }

    return levels;
  }

  /**
   * Validates if provided level code is recognized.
   * @param level - Level code to validate (e.g., 'a1', 'b2')
   * @returns true if level is valid, false otherwise
   */
  private isValidLevel(level: string): boolean {
    return this.VALID_LEVELS.includes(level.toLowerCase() as any);
  }
}
