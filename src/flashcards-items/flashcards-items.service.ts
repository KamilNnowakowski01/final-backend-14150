import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashcardsItem } from './flashcards-item.entity';
import { CreateFlashcardsItemDto } from './dto/create-flashcards-item.dto';
import { UpdateFlashcardsItemDto } from './dto/update-flashcards-item.dto';
import { Repetition } from '../repetitions/repetition.entity';
import { calculateSM2 } from '../repetitions/sm2.calculator';

/**
 * Service responsible for managing flashcard items.
 *
 * Handles CRUD operations and score processing using SM-2 algorithm.
 */
@Injectable()
export class FlashcardsItemsService {
  private readonly logger = new Logger(FlashcardsItemsService.name);

  constructor(
    @InjectRepository(FlashcardsItem)
    private readonly flashcardsItemsRepository: Repository<FlashcardsItem>,
    @InjectRepository(Repetition)
    private readonly repetitionsRepository: Repository<Repetition>,
  ) {}

  async create(createFlashcardsItemDto: CreateFlashcardsItemDto): Promise<FlashcardsItem> {
    const item = this.flashcardsItemsRepository.create(createFlashcardsItemDto);
    return this.flashcardsItemsRepository.save(item);
  }

  async findAll(): Promise<FlashcardsItem[]> {
    return this.flashcardsItemsRepository.find();
  }

  async findAllBySession(sessionId: string): Promise<FlashcardsItem[]> {
    return this.flashcardsItemsRepository.find({ where: { sessionId } });
  }

  async findOne(id: string): Promise<FlashcardsItem> {
    const item = await this.flashcardsItemsRepository.findOne({ where: { id }, relations: ['repetition'] });
    if (!item) {
      throw new NotFoundException(`FlashcardsItem with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, updateFlashcardsItemDto: UpdateFlashcardsItemDto): Promise<FlashcardsItem> {
    const item = await this.findOne(id);
    Object.assign(item, updateFlashcardsItemDto);
    return this.flashcardsItemsRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.flashcardsItemsRepository.remove(item);
  }

  /**
   * Processes user's score for a flashcard item using the SM-2 algorithm.
   *
   * Updates the item's repetition state (easiness factor, interval, dates)
   * and learning stage based on the provided score.
   *
   * @param id - Flashcard item ID
   * @param score - User's recall quality rating (0-5)
   * @returns Updated flashcard item with new repetition state
   * @throws NotFoundException if item or its repetition not found
   *
   * @example
   * ```ts
   * const updatedItem = await service.sendScore('item-uuid', 4);
   * // updatedItem.stage === 'passed', repetition updated
   * ```
   */
  async sendScore(id: string, score: number): Promise<FlashcardsItem> {
    const item = await this.findOne(id);
    const repetition = this.validateRepetition(item, id);

    const sm2Result = calculateSM2(
      {
        easinessFactor: repetition.easinessFactor,
        repetitions: repetition.repetitions,
        nextInterval: repetition.nextInterval,
      },
      score,
    );

    this.logger.debug(
      `SM-2 calculated for item ${id}: interval=${sm2Result.nextInterval}, ` +
      `EF=${sm2Result.easinessFactor.toFixed(2)}, stage=${sm2Result.stage}`,
    );

    await this.updateRepetition(repetition, sm2Result);
    
    return this.updateItemStage(item, sm2Result.stage);
  }

  /**
   * Validates that the item has an associated repetition record.
   *
   * @param item - Flashcard item to validate
   * @param itemId - Item ID for error message
   * @returns Valid repetition record
   * @throws NotFoundException if repetition not found
   */
  private validateRepetition(item: FlashcardsItem, itemId: string): Repetition {
    if (!item.repetition) {
      throw new NotFoundException(`Repetition for item ${itemId} not found`);
    }
    return item.repetition;
  }

  /**
   * Persists updated repetition state to database.
   *
   * @param repetition - Repetition entity to update
   * @param sm2Result - New values from SM-2 calculation
   */
  private async updateRepetition(
    repetition: Repetition,
    sm2Result: ReturnType<typeof calculateSM2>,
  ): Promise<void> {
    repetition.easinessFactor = sm2Result.easinessFactor;
    repetition.repetitions = sm2Result.repetitions;
    repetition.nextInterval = sm2Result.nextInterval;
    repetition.dateLastRep = sm2Result.dateLastRep;
    repetition.dateNextRep = sm2Result.dateNextRep;

    await this.repetitionsRepository.save(repetition);
  }

  /**
   * Updates item's learning stage and persists to database.
   *
   * @param item - Flashcard item to update
   * @param stage - New learning stage
   * @returns Updated flashcard item
   */
  private async updateItemStage(
    item: FlashcardsItem,
    stage: 'learning' | 'passed',
  ): Promise<FlashcardsItem> {
    item.stage = stage;
    return this.flashcardsItemsRepository.save(item);
  }
}
