import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../../words/word.entity';
import { INewWordsStrategy } from './new-words-strategy.interface';

/**
 * Random word selection strategy.
 * Selects new (unlearned) words randomly regardless of level or difficulty.
 * Suitable for users who prefer varied learning without structure.
 */
@Injectable()
export class RandomWordsStrategy implements INewWordsStrategy {
  private readonly logger = new Logger(RandomWordsStrategy.name);

  constructor(
    @InjectRepository(Word) private readonly wordsRepository: Repository<Word>
  ) {}

  /**
   * Retrieves random unlearned words for user.
   * @param userId - User identifier
   * @param limit - Number of words to retrieve
   * @param sessionType - Ignored in random strategy (can be any value)
   * @returns Promise resolving to array of random Word entities
   */
  async getNewWords(userId: string, limit: number, sessionType: string): Promise<Word[]> {
    this.logger.debug(
      `Fetching ${limit} random new words for user ${userId}`
    );

    try {
      return await this.wordsRepository
        .createQueryBuilder('word')
        .leftJoin('word.repetitions', 'repetition', 'repetition.userId = :userId', { userId })
        .where('repetition.id IS NULL')
        .orderBy('RANDOM()')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to fetch random words for user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
