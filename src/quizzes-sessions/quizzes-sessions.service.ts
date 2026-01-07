import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, QueryRunner } from 'typeorm';
import { QuizzesSession } from './quizzes-session.entity';
import { CreateQuizzesSessionDto } from './dto/create-quizzes-session.dto';
import { UpdateQuizzesSessionDto } from './dto/update-quizzes-session.dto';
import { SubmitPackageDto } from './dto/submit-package.dto';
import { SubmitPackageResultDto } from './dto/submit-package-result.dto';
import { QuizzesPackage } from '../quizzes-packages/quizzes-package.entity';
import { Word } from '../words/word.entity';
import { AiGeneratorService, GeneratedQuestion } from '../ai-generator/ai-generator.service';
import { QuizzesItem } from '../quizzes-items/quizzes-item.entity';

/**
 * Quiz session configuration constants.
 */
const QUIZ_CONFIG = {
  /** Number of words per quiz package */
  WORDS_PER_PACKAGE: 12,
  /** Maximum packages per session */
  MAX_PACKAGES: 3,
  /** Maximum AI generation retry attempts */
  MAX_GENERATION_ATTEMPTS: 2,
  /** Default difficulty level */
  DEFAULT_LEVEL: 'B1-B2',
  /** Available difficulty levels (ordered by difficulty) */
  LEVELS: ['A1-A2', 'B1-B2', 'C1-C2'] as const,
  /** Score thresholds for level adaptation */
  ADAPTATION: {
    LEVEL_UP_THRESHOLD: 0.75,
    LEVEL_DOWN_THRESHOLD: 0.50,
  },
} as const;

/**
 * Service responsible for managing quiz sessions.
 *
 * Handles session lifecycle, package generation with AI,
 * answer submission, and adaptive difficulty adjustment.
 */
@Injectable()
export class QuizzesSessionsService {
  private readonly logger = new Logger(QuizzesSessionsService.name);

  constructor(
    @InjectRepository(QuizzesSession)
    private readonly sessionsRepository: Repository<QuizzesSession>,
    @InjectRepository(QuizzesPackage)
    private readonly packagesRepository: Repository<QuizzesPackage>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
    @InjectRepository(QuizzesItem)
    private readonly itemsRepository: Repository<QuizzesItem>,
    private readonly aiGeneratorService: AiGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves all quiz sessions for a user.
   *
   * @param userId - User ID
   * @returns Array of sessions with packages and items
   */
  async findAll(userId: string): Promise<QuizzesSession[]> {
    return this.sessionsRepository.find({
      where: { userId },
      relations: ['packages', 'packages.items'],
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Retrieves a single quiz session by ID.
   *
   * @param id - Session ID
   * @param userId - User ID for authorization
   * @returns Session with packages and items, or null if not found
   */
  async findOne(id: string, userId: string): Promise<QuizzesSession | null> {
    const session = await this.sessionsRepository.findOne({
      where: { id, userId },
      relations: ['packages', 'packages.items'],
      order: { packages: { createdAt: 'ASC' } },
    });

    this.logSessionDetails(session);
    return session;
  }

  /**
   * Creates a new quiz session with initial package.
   *
   * @param userId - User ID
   * @param createDto - Session creation data
   * @returns Created session with populated package
   */
  async create(userId: string, createDto: CreateQuizzesSessionDto): Promise<QuizzesSession> {
    return this.executeInTransaction(async (queryRunner) => {
      const session = queryRunner.manager.create(QuizzesSession, {
        ...createDto,
        userId,
      });
      const savedSession = await queryRunner.manager.save(session);

      await this.populateSession(savedSession.id, queryRunner, 'package-1');

      // Use queryRunner.manager to read within the same transaction
      const result = await queryRunner.manager.findOne(QuizzesSession, {
        where: { id: savedSession.id, userId },
        relations: ['packages', 'packages.items'],
        order: { packages: { createdAt: 'ASC' } },
      });

      if (!result) {
        throw new Error('Failed to create session');
      }

      this.logSessionDetails(result);
      return result;
    });
  }

  /**
   * Populates a quiz package with AI-generated questions.
   *
   * Creates a package, fetches random words for the given level,
   * generates questions using AI, and saves them to the database.
   *
   * @param sessionId - Session ID to attach the package to
   * @param queryRunner - Active transaction query runner
   * @param packageName - Package identifier (e.g., 'package-1')
   * @param level - Difficulty level (e.g., 'B1-B2')
   * @returns Created package entity
   * @throws Error if no words found or AI generation fails
   */
  private async populateSession(
    sessionId: string,
    queryRunner: QueryRunner,
    packageName: string,
    level: string = QUIZ_CONFIG.DEFAULT_LEVEL,
  ): Promise<QuizzesPackage> {
    const savedPkg = await this.createPackage(queryRunner, sessionId, packageName, level);
    const words = await this.fetchRandomWords(level);

    await this.generateAndSaveQuizItems(queryRunner, savedPkg.id, words, level);

    return savedPkg;
  }

  /**
   * Creates a new quiz package entity.
   */
  private async createPackage(
    queryRunner: QueryRunner,
    sessionId: string,
    packageName: string,
    level: string,
  ): Promise<QuizzesPackage> {
    const pkg = queryRunner.manager.create(QuizzesPackage, {
      sessionId,
      package: packageName,
      level,
    });
    return queryRunner.manager.save(pkg);
  }

  /**
   * Fetches random words for quiz generation.
   *
   * @param level - Difficulty level string (e.g., 'B1-B2')
   * @returns Array of words with meanings
   * @throws Error if no words found for the given levels
   */
  private async fetchRandomWords(level: string): Promise<Word[]> {
    const levels = this.parseLevelString(level);

    const randomIds = await this.wordsRepository
      .createQueryBuilder('word')
      .select('word.id')
      .where('word.level IN (:...levels)', { levels })
      .orderBy('RANDOM()')
      .limit(QUIZ_CONFIG.WORDS_PER_PACKAGE)
      .getMany();

    const ids = randomIds.map((w) => w.id);

    if (ids.length === 0) {
      this.logger.warn(`No words found for levels: ${levels.join(', ')}`);
      throw new Error(`No words found for levels: ${levels.join(', ')}`);
    }

    const words = await this.wordsRepository.find({
      where: { id: In(ids) },
      relations: ['meanings'],
    });

    if (words.length < QUIZ_CONFIG.WORDS_PER_PACKAGE) {
      this.logger.warn(
        `NOT ENOUGH WORDS: Found only ${words.length} words for levels ${levels.join(', ')}. ` +
        `Expected ${QUIZ_CONFIG.WORDS_PER_PACKAGE}. Please populate the database.`,
      );
    }

    return words;
  }

  /**
   * Generates quiz questions using AI and saves them to database.
   * Implements retry logic with savepoints for resilience.
   *
   * @param queryRunner - Active transaction query runner
   * @param packageId - Package ID to attach items to
   * @param words - Words to generate questions for
   * @param level - Difficulty level for question generation
   * @throws Error if generation fails after max attempts
   */
  private async generateAndSaveQuizItems(
    queryRunner: QueryRunner,
    packageId: string,
    words: Word[],
    level: string,
  ): Promise<void> {
    let attempts = 0;

    while (attempts < QUIZ_CONFIG.MAX_GENERATION_ATTEMPTS) {
      attempts++;

      try {
        const generatedQuestions = await this.aiGeneratorService.generateQuizQuestions(words, level);
        await this.saveQuizItemsWithSavepoint(queryRunner, packageId, generatedQuestions, attempts);
        return;
      } catch (error) {
        this.logger.error(`Attempt ${attempts} failed: Error generating/saving quiz items`, error);

        if (attempts >= QUIZ_CONFIG.MAX_GENERATION_ATTEMPTS) {
          throw new Error('Failed to create quiz: AI generation failed after retries.');
        }
      }
    }
  }

  /**
   * Saves quiz items using a savepoint for safe retry within transaction.
   */
  private async saveQuizItemsWithSavepoint(
    queryRunner: QueryRunner,
    packageId: string,
    generatedQuestions: GeneratedQuestion[],
    attemptNumber: number,
  ): Promise<void> {
    const itemsToSave = generatedQuestions.map((gq) =>
      queryRunner.manager.create(QuizzesItem, {
        packageId,
        wordId: gq.wordId,
        type: gq.type,
        question: gq.question,
        correctAnswer: gq.correctAnswer,
        answerA: gq.answerA,
        answerB: gq.answerB,
        answerC: gq.answerC,
      }),
    );

    if (itemsToSave.length === 0) {
      return;
    }

    const savepointName = `save_items_${attemptNumber}`;
    await queryRunner.query(`SAVEPOINT ${savepointName}`);

    try {
      await queryRunner.manager.save(itemsToSave);
      await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
    } catch (saveError) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      throw saveError;
    }
  }

  /**
   * Submits user answers for a quiz package and calculates score.
   *
   * @param userId - User ID for authorization
   * @param dto - Package ID and array of answers
   * @returns Score summary with correct count and percentage
   * @throws Error if package not found or unauthorized
   */
  async submitPackage(userId: string, dto: SubmitPackageDto): Promise<SubmitPackageResultDto> {
    const pkg = await this.findPackageWithValidation(dto.packageId, userId);

    const { correctCount, total } = await this.processAnswers(pkg, dto.answers);
    const scorePercentage = this.calculateScorePercentage(correctCount, total);

    return {
      packageId: pkg.id,
      correctCount,
      total,
      scorePercentage,
    };
  }

  /**
   * Generates the next quiz package with adaptive difficulty.
   *
   * Analyzes user's performance on the previous package and adjusts
   * difficulty level accordingly:
   * - Score > 75%: Level up (harder questions)
   * - Score 50-75%: Same level
   * - Score < 50%: Level down (easier questions)
   *
   * @param userId - User ID
   * @returns Newly created package with questions
   * @throws Error if no active session, max packages reached, or previous incomplete
   */
  async generateNextPackage(userId: string): Promise<QuizzesPackage> {
    const session = await this.getActiveSession(userId);
    const existingPackages = await this.getSessionPackages(session.id);

    this.validateCanGenerateNextPackage(existingPackages);

    const lastPackage = this.getLastPackage(existingPackages);
    this.validatePackageCompleted(lastPackage);

    const nextLevel = this.calculateAdaptiveLevel(lastPackage);
    const nextPackageName = `package-${existingPackages.length + 1}`;

    const newPackage = await this.executeInTransaction(async (queryRunner) => {
      return this.populateSession(
        session.id,
        queryRunner,
        nextPackageName,
        nextLevel,
      );
    });

    // Fetch package with items AFTER transaction is committed
    const result = await this.packagesRepository.findOne({
      where: { id: newPackage.id },
      relations: ['items'],
    });

    if (!result) {
      throw new Error('Failed to retrieve created package');
    }
    return result;
  }

  /**
   * Finishes an active quiz session.
   *
   * @param userId - User ID
   * @returns Completed session
   * @throws Error if no active session, less than 3 packages, or last package incomplete
   */
  async finishSession(userId: string): Promise<QuizzesSession> {
    const session = await this.getActiveSession(userId);
    const existingPackages = await this.getSessionPackages(session.id);

    if (existingPackages.length < QUIZ_CONFIG.MAX_PACKAGES) {
      throw new Error(`Cannot finish session. Less than ${QUIZ_CONFIG.MAX_PACKAGES} packages generated.`);
    }

    const lastPackage = this.getLastPackage(existingPackages);
    this.validatePackageCompleted(lastPackage, 'Cannot finish session. Last package is not completed.');

    session.status = 'completed';
    session.endedAt = new Date();
    return this.sessionsRepository.save(session);
  }

  /**
   * Starts a new quiz session or resumes today's active session.
   *
   * @param userId - User ID
   * @returns Active or newly created session
   */
  async startSession(userId: string): Promise<QuizzesSession> {
    const lastSession = await this.sessionsRepository.findOne({
      where: { userId },
      order: { startedAt: 'DESC' },
    });

    if (!lastSession) {
      return this.createNewSession(userId);
    }

    if (this.isSessionFromToday(lastSession) && lastSession.status === 'active') {
      return this.resumeSession(lastSession.id, userId);
    }

    if (lastSession.status === 'active') {
      await this.closeStaleSession(lastSession.id);
    }

    return this.createNewSession(userId);
  }

  /**
   * Updates a quiz session.
   *
   * @param id - Session ID
   * @param userId - User ID for authorization
   * @param updateDto - Update data
   * @returns Updated session or null if not found
   */
  async update(id: string, userId: string, updateDto: UpdateQuizzesSessionDto): Promise<QuizzesSession | null> {
    const existing = await this.findOne(id, userId);
    if (!existing) return null;

    await this.sessionsRepository.update(id, updateDto);
    return this.findOne(id, userId);
  }

  /**
   * Deletes a quiz session.
   *
   * @param id - Session ID
   * @param userId - User ID for authorization
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findOne(id, userId);
    if (existing) {
      await this.sessionsRepository.delete(id);
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  /**
   * Executes an operation within a database transaction.
   */
  private async executeInTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Logs session details for debugging.
   */
  private logSessionDetails(session: QuizzesSession | null): void {
    if (!session) return;

    this.logger.log(`findOne session ${session.id}: packages count = ${session.packages?.length}`);
    session.packages?.forEach((p) => {
      this.logger.log(`Package ${p.id} items count = ${p.items?.length}`);
    });
  }

  /**
   * Retrieves the user's active session.
   *
   * @throws Error if no active session found
   */
  private async getActiveSession(userId: string): Promise<QuizzesSession> {
    const session = await this.sessionsRepository.findOne({
      where: { userId, status: 'active' },
      order: { startedAt: 'DESC' },
    });

    if (!session) {
      throw new Error('No active session found for this user.');
    }

    return session;
  }

  /**
   * Retrieves all packages for a session with items.
   */
  private async getSessionPackages(sessionId: string): Promise<QuizzesPackage[]> {
    return this.packagesRepository.find({
      where: { sessionId },
      relations: ['items'],
    });
  }

  /**
   * Finds a package and validates user ownership.
   *
   * @throws Error if package not found or unauthorized
   */
  private async findPackageWithValidation(packageId: string, userId: string): Promise<QuizzesPackage> {
    const pkg = await this.packagesRepository.findOne({
      where: { id: packageId },
      relations: ['items', 'session'],
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    if (pkg.session.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return pkg;
  }

  /**
   * Processes user answers and counts correct ones.
   */
  private async processAnswers(
    pkg: QuizzesPackage,
    answers: Array<{ itemId: string; answer: string }>,
  ): Promise<{ correctCount: number; total: number }> {
    let correctCount = 0;

    for (const answerDto of answers) {
      const item = pkg.items.find((i) => i.id === answerDto.itemId);
      if (item) {
        item.userAnswer = answerDto.answer;
        await this.itemsRepository.save(item);

        if (item.userAnswer === item.correctAnswer) {
          correctCount++;
        }
      }
    }

    return { correctCount, total: pkg.items.length };
  }

  /**
   * Calculates score as percentage.
   */
  private calculateScorePercentage(correctCount: number, total: number): number {
    return total > 0 ? (correctCount / total) * 100 : 0;
  }

  /**
   * Validates that more packages can be generated.
   *
   * @throws Error if max packages reached
   */
  private validateCanGenerateNextPackage(existingPackages: QuizzesPackage[]): void {
    if (existingPackages.length >= QUIZ_CONFIG.MAX_PACKAGES) {
      throw new Error(`Session complete. Maximum ${QUIZ_CONFIG.MAX_PACKAGES} packages allowed.`);
    }
  }

  /**
   * Gets the last package from sorted array.
   */
  private getLastPackage(packages: QuizzesPackage[]): QuizzesPackage {
    const sorted = [...packages].sort((a, b) => a.package.localeCompare(b.package));
    return sorted[sorted.length - 1];
  }

  /**
   * Validates that all items in a package have been answered.
   *
   * @throws Error if package is incomplete
   */
  private validatePackageCompleted(
    pkg: QuizzesPackage,
    errorMessage = 'Complete previous package first',
  ): void {
    const allAnswered = pkg.items.every((i) => i.userAnswer !== null);
    if (!allAnswered) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Calculates the next difficulty level based on user performance.
   * Implements adaptive learning algorithm.
   */
  private calculateAdaptiveLevel(lastPackage: QuizzesPackage): string {
    const score = this.calculatePackageScore(lastPackage);
    let currentLevelIndex = this.getLevelIndex(lastPackage.level);

    if (currentLevelIndex === -1) {
      currentLevelIndex = 1; // Default B1-B2
    }

    const nextLevelIndex = this.adaptLevelIndex(currentLevelIndex, score);
    const nextLevel = this.getLevelString(nextLevelIndex);

    this.logger.debug(
      `Adaptive level: score=${(score * 100).toFixed(0)}%, ` +
      `${lastPackage.level} → ${nextLevel}`,
    );

    return nextLevel;
  }

  /**
   * Calculates the score ratio for a package.
   */
  private calculatePackageScore(pkg: QuizzesPackage): number {
    const correctCount = pkg.items.filter((i) => i.userAnswer === i.correctAnswer).length;
    const total = pkg.items.length;
    return total > 0 ? correctCount / total : 0;
  }

  /**
   * Adapts level index based on score thresholds.
   */
  private adaptLevelIndex(currentIndex: number, score: number): number {
    const maxIndex = QUIZ_CONFIG.LEVELS.length - 1;

    if (score > QUIZ_CONFIG.ADAPTATION.LEVEL_UP_THRESHOLD) {
      return Math.min(currentIndex + 1, maxIndex);
    }

    if (score < QUIZ_CONFIG.ADAPTATION.LEVEL_DOWN_THRESHOLD) {
      return Math.max(currentIndex - 1, 0);
    }

    return currentIndex;
  }

  /**
   * Parses level string into individual levels.
   * E.g., 'B1-B2' → ['B1', 'B2']
   */
  private parseLevelString(level: string): string[] {
    return level.split('-');
  }

  /**
   * Gets the index of a level in the levels array.
   */
  private getLevelIndex(level: string): number {
    return QUIZ_CONFIG.LEVELS.indexOf(level as typeof QUIZ_CONFIG.LEVELS[number]);
  }

  /**
   * Gets the level string for a given index.
   */
  private getLevelString(index: number): string {
    return QUIZ_CONFIG.LEVELS[index] || QUIZ_CONFIG.DEFAULT_LEVEL;
  }

  /**
   * Checks if a session was started today.
   */
  private isSessionFromToday(session: QuizzesSession): boolean {
    const today = new Date();
    const sessionDate = new Date(session.startedAt);

    return (
      today.getFullYear() === sessionDate.getFullYear() &&
      today.getMonth() === sessionDate.getMonth() &&
      today.getDate() === sessionDate.getDate()
    );
  }

  /**
   * Creates a new default session.
   */
  private createNewSession(userId: string): Promise<QuizzesSession> {
    return this.create(userId, {
      type: 'default',
      status: 'active',
    } as CreateQuizzesSessionDto);
  }

  /**
   * Resumes an existing session.
   *
   * @throws Error if session not found
   */
  private async resumeSession(sessionId: string, userId: string): Promise<QuizzesSession> {
    const session = await this.findOne(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  /**
   * Closes a stale (past) active session.
   */
  private async closeStaleSession(sessionId: string): Promise<void> {
    await this.sessionsRepository.update(sessionId, {
      status: 'completed',
      endedAt: new Date(),
    });
  }
}


