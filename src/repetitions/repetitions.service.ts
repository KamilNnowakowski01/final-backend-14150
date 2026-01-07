import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Repetition } from './repetition.entity';
import { Word } from '../words/word.entity';
import { CreateRepetitionDto } from './dto/create-repetition.dto';
import { UpdateRepetitionDto } from './dto/update-repetition.dto';
import { RepetitionsStatsResponseDto, LevelStatsDto } from './dto/get-repetitions-stats-response.dto';

@Injectable()
export class RepetitionsService {
  constructor(
    @InjectRepository(Repetition)
    private repetitionsRepository: Repository<Repetition>,
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
  ) {}

  async getStats(userId: string): Promise<RepetitionsStatsResponseDto> {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    // 1. Get total words per level
    const totalWordsQuery = await this.wordsRepository
      .createQueryBuilder('word')
      .select('word.level', 'level')
      .addSelect('COUNT(word.id)', 'count')
      .where('word.level IN (:...levels)', { levels })
      .groupBy('word.level')
      .getRawMany();
      
    const totalWordsMap = new Map<string, number>();
    totalWordsQuery.forEach(row => totalWordsMap.set(row.level, parseInt(row.count, 10)));

    // 2. Get user stats per level
    const userStatsQuery = await this.repetitionsRepository
      .createQueryBuilder('repetition')
      .leftJoin('repetition.word', 'word')
      .select('word.level', 'level')
      .addSelect('COUNT(repetition.id)', 'totalUser')
      .addSelect('SUM(CASE WHEN repetition.easinessFactor >= 2.8 THEN 1 ELSE 0 END)', 'mastered')
      .where('repetition.userId = :userId', { userId })
      .andWhere('word.level IN (:...levels)', { levels })
      .groupBy('word.level')
      .getRawMany();

    const stats: { [key: string]: LevelStatsDto } = {};

    levels.forEach(level => {
      const total = totalWordsMap.get(level) || 0;
      const userStat = userStatsQuery.find(s => s.level === level);
      const totalUser = userStat ? parseInt(userStat.totalUser, 10) : 0;
      const mastered = userStat ? parseInt(userStat.mastered, 10) : 0;
      const learning = totalUser - mastered;

      stats[level] = {
        level,
        total,
        totalUser,
        learning,
        mastered
      };
    });

    return {
      userId,
      stats
    };
  }

  async findAll(userId: string, wordId?: string): Promise<Repetition[]> {
    const where: any = { userId };
    if (wordId) {
      where.wordId = wordId;
    }
    return this.repetitionsRepository.find({
      where,
      relations: ['word', 'word.meanings', 'user'],
    });
  }

  async findOne(id: string, userId: string): Promise<Repetition | null> {
    return this.repetitionsRepository.findOne({
      where: { id, userId },
      relations: ['word', 'word.meanings', 'user'],
    });
  }

  async create(userId: string, createRepetitionDto: CreateRepetitionDto): Promise<Repetition> {
    const repetition = this.repetitionsRepository.create({
      ...createRepetitionDto,
      userId,
    });
    return this.repetitionsRepository.save(repetition);
  }

  async update(id: string, userId: string, updateRepetitionDto: UpdateRepetitionDto): Promise<Repetition | null> {
    const existing = await this.findOne(id, userId);
    if (!existing) return null;
    
    await this.repetitionsRepository.update(id, updateRepetitionDto);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findOne(id, userId);
    if (existing) {
      await this.repetitionsRepository.delete(id);
    }
  }

  async getDueRepetitions(userId: string, limit: number): Promise<Repetition[]> {
    return this.repetitionsRepository.find({
      where: {
        userId,
        dateNextRep: LessThanOrEqual(new Date()),
      },
      order: {
        dateNextRep: 'ASC',
      },
      take: limit,
    });
  }

  async createForWords(userId: string, words: Word[]): Promise<Repetition[]> {
    const repetitions = words.map((word) =>
      this.repetitionsRepository.create({
        userId,
        wordId: word.id,
      })
    );

    return this.repetitionsRepository.save(repetitions);
  }
}
