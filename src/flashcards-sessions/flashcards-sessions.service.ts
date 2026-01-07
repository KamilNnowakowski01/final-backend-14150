import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashcardsSession } from './flashcards-session.entity';
import { CreateFlashcardsSessionDto } from './dto/create-flashcards-session.dto';
import { UpdateFlashcardsSessionDto } from './dto/update-flashcards-session.dto';
import { Repetition } from '../repetitions/repetition.entity';
import { FlashcardsItem } from '../flashcards-items/flashcards-item.entity';
import { Word } from '../words/word.entity';
import { WordsStrategyFactory } from './strategies/words-strategy.factory';
import { RepetitionsService } from '../repetitions/repetitions.service';
import { UsersService } from '../users/users.service';

/**
 * Service for managing flashcard sessions.
 * Orchestrates session lifecycle: creation, population with cards, tracking progress, and completion.
 * Uses Strategy pattern for flexible word selection (random vs level-based).
 */
@Injectable()
export class FlashcardsSessionsService {
  private readonly logger = new Logger(FlashcardsSessionsService.name);

  // Stałe dla statusów i stage
  private readonly ITEM_STATUS = {
    NEW: 'new',
    REVIEW: 'review',
  } as const;

  private readonly ITEM_STAGE = {
    REVIEW: 'review',
    LEARNING: 'learning',
    PASSED: 'passed',
  } as const;

  private readonly SESSION_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
  } as const;

  private readonly DEFAULT_LIMITS = {
    DAILY_REVIEW: 50,
    DAILY_NEW: 10,
  } as const;

  constructor(
    @InjectRepository(FlashcardsSession)
    private readonly sessionsRepository: Repository<FlashcardsSession>,
    @InjectRepository(FlashcardsItem)
    private readonly flashcardsItemsRepository: Repository<FlashcardsItem>,
    private readonly repetitionsService: RepetitionsService,
    private readonly usersService: UsersService,
    private readonly strategyFactory: WordsStrategyFactory,
  ) {}

  /**
   * Retrieves all sessions for a user with computed statistics.
   * @param userId - User identifier
   * @returns Promise with array of sessions including stats (new/review/learning/mastered cards count)
   */
  async findAll(userId: string): Promise<any[]> {
    const sessions = await this.sessionsRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      relations: ['items'],
    });

    return sessions.map(session => this.mapSessionWithStats(session));
  }

  private mapSessionWithStats(session: FlashcardsSession) {
    const items = session.items || [];
    const { items: _items, ...sessionData } = session;

    return {
      ...sessionData,
      stats: this.calculateSessionStats(items),
    };
  }

  private calculateSessionStats(items: FlashcardsItem[]) {
    return {
      newCards: items.filter(i => i.status === this.ITEM_STATUS.NEW).length,
      reviewCards: items.filter(i => i.status === this.ITEM_STATUS.REVIEW).length,
      repeatCards: items.filter(i => i.stage === this.ITEM_STAGE.LEARNING).length,
      masteredCards: items.filter(i => i.stage === this.ITEM_STAGE.PASSED).length,
      totalCards: items.length,
    };
  }

  /**
   * Retrieves a single session with all related items and repetitions.
   * @param id - Session identifier
   * @param userId - User identifier (for authorization)
   * @returns Promise with session or null if not found
   */
  async findOne(id: string, userId: string): Promise<FlashcardsSession | null> {
    return this.sessionsRepository.findOne({
      where: { id, userId },
      relations: ['items'],
    });
  }

  /**
   * Creates a new flashcard session for user.
   * Automatically populates session with items based on user's learning limits and strategy.
   * @param userId - User identifier
   * @param createDto - Session creation data (type, status)
   * @returns Promise with created session including all items
   */
  async create(userId: string, createDto: CreateFlashcardsSessionDto): Promise<FlashcardsSession> {
    const session = this.sessionsRepository.create({
      ...createDto,
      userId,
    });
    const savedSession = await this.sessionsRepository.save(session);
    
    await this.populateSession(savedSession.id, userId);
    
    return this.fetchSessionWithFullRelations(savedSession.id, userId);
  }

  private async fetchSessionWithFullRelations(sessionId: string, userId: string): Promise<FlashcardsSession> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, userId },
      relations: [
        'items',
        'items.repetition',
        'items.repetition.word',
        'items.repetition.word.meanings'
      ],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return session;
  }

  private async populateSession(sessionId: string, userId: string): Promise<void> {
    const limits = await this.getUserLimits(userId);
    const reviewItems = await this.fetchAndCreateReviewItems(sessionId, userId, limits.maxItems);
    const newItems = await this.fetchAndCreateNewItems(sessionId, userId, limits, reviewItems.length);
    
    const allItems = [...reviewItems, ...newItems];
    
    if (allItems.length > 0) {
      await this.flashcardsItemsRepository.save(allItems);
    }
  }

  private async getUserLimits(userId: string) {
    const limits = await this.usersService.getUserLimits(userId);
    
    return {
      maxItems: limits.dailyReview,
      maxNewItems: limits.dailyNew,
    };
  }

  private async fetchAndCreateReviewItems(
    sessionId: string,
    userId: string,
    limit: number,
  ): Promise<FlashcardsItem[]> {
    const dueRepetitions = await this.repetitionsService.getDueRepetitions(userId, limit);

    return dueRepetitions.map((rep) =>
      this.flashcardsItemsRepository.create({
        sessionId,
        repetitionId: rep.id,
        status: this.ITEM_STATUS.REVIEW,
        stage: this.ITEM_STAGE.REVIEW,
      })
    );
  }

  private async fetchAndCreateNewItems(
    sessionId: string,
    userId: string,
    limits: { maxItems: number; maxNewItems: number },
    reviewItemsCount: number,
  ): Promise<FlashcardsItem[]> {
    const missingCount = limits.maxItems - reviewItemsCount;
    
    if (missingCount <= 0) {
      return [];
    }

    const countToAdd = Math.min(missingCount, limits.maxNewItems);
    
    if (countToAdd === 0) {
      return [];
    }

    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    const sessionType = session?.type || 'random';

    const strategy = this.strategyFactory.getStrategy(sessionType);
    const newWords = await strategy.getNewWords(userId, countToAdd, sessionType);

    if (newWords.length === 0) {
      return [];
    }

    const newRepetitions = await this.createRepetitionsForWords(userId, newWords);
    
    return newRepetitions.map((rep) =>
      this.flashcardsItemsRepository.create({
        sessionId,
        repetitionId: rep.id,
        status: this.ITEM_STATUS.NEW,
        stage: this.ITEM_STAGE.REVIEW,
      })
    );
  }

  private async createRepetitionsForWords(userId: string, words: Word[]): Promise<Repetition[]> {
    return this.repetitionsService.createForWords(userId, words);
  }

  /**
   * Updates session properties.
   * @param id - Session identifier
   * @param userId - User identifier (for authorization)
   * @param updateDto - Partial session data to update
   * @returns Promise with updated session or null if not found
   */
  async update(id: string, userId: string, updateDto: UpdateFlashcardsSessionDto): Promise<FlashcardsSession | null> {
    const existing = await this.findOne(id, userId);
    if (!existing) return null;

    await this.sessionsRepository.update(id, updateDto);
    return this.findOne(id, userId);
  }

  /**
   * Deletes a session and all related items.
   * @param id - Session identifier
   * @param userId - User identifier (for authorization)
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findOne(id, userId);
    if (existing) {
      await this.sessionsRepository.delete(id);
    }
  }

  /**
   * Starts a new learning session or returns today's active session.
   * If user already has a session from today, returns it.
   * Otherwise, completes yesterday's session and creates a new one.
   * @param userId - User identifier
   * @returns Promise with active session ready for learning
   */
  async startSession(userId: string): Promise<FlashcardsSession> {
    const strategyType = await this.usersService.getLearningStrategy(userId);

    const lastSession = await this.fetchLastSession(userId);

    if (!lastSession) {
      return this.createNewSession(userId, strategyType);
    }

    if (this.isSessionFromToday(lastSession)) {
      return lastSession;
    }

    await this.completeSessionIfActive(lastSession);
    return this.createNewSession(userId, strategyType);
  }

  private async fetchLastSession(userId: string): Promise<FlashcardsSession | null> {
    return this.sessionsRepository.findOne({
      where: { userId },
      order: { startedAt: 'DESC' },
      relations: [
        'items',
        'items.repetition',
        'items.repetition.word',
        'items.repetition.word.meanings'
      ],
    });
  }

  private isSessionFromToday(session: FlashcardsSession): boolean {
    const today = new Date();
    const sessionDate = new Date(session.startedAt);
    
    return (
      today.getFullYear() === sessionDate.getFullYear() &&
      today.getMonth() === sessionDate.getMonth() &&
      today.getDate() === sessionDate.getDate()
    );
  }

  private async completeSessionIfActive(session: FlashcardsSession): Promise<void> {
    if (session.status === this.SESSION_STATUS.ACTIVE) {
      await this.sessionsRepository.update(session.id, { 
        status: this.SESSION_STATUS.COMPLETED 
      });
    }
  }

  private async createNewSession(userId: string, strategyType: string): Promise<FlashcardsSession> {
    return this.create(userId, {
      type: strategyType,
      status: this.SESSION_STATUS.ACTIVE,
    } as CreateFlashcardsSessionDto);
  }

  /**
   * Finishes the active session for user.
   * Validates that all cards are marked as passed before allowing completion.
   * @param userId - User identifier
   * @returns Promise with completed session
   * @throws NotFoundException if no active session found
   * @throws BadRequestException if not all items are passed
   */
  async finishSession(userId: string): Promise<FlashcardsSession> {
    const session = await this.sessionsRepository.findOne({
      where: { userId },
      order: { startedAt: 'DESC' },
      relations: ['items'],
    });

    if (!session) {
      throw new NotFoundException('No active session found for user');
    }

    if (session.status === this.SESSION_STATUS.COMPLETED) {
      return session;
    }

    this.validateAllItemsPassed(session.items);

    session.status = this.SESSION_STATUS.COMPLETED;
    session.endedAt = new Date();

    return this.sessionsRepository.save(session);
  }

  private validateAllItemsPassed(items: FlashcardsItem[]): void {
    const allPassed = items.every((item) => item.stage === this.ITEM_STAGE.PASSED);

    if (!allPassed) {
      throw new BadRequestException('Cannot finish session. Not all items are passed.');
    }
  }
}
