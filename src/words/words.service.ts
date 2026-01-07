import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './word.entity';
import { Meaning } from './meaning.entity';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
  ) {}

  async findAll(): Promise<Word[]> {
    return this.wordsRepository.find({
      relations: ['meanings'],
    });
  }

  async findOne(id: string): Promise<Word | null> {
    return this.wordsRepository.findOne({
      where: { id },
      relations: ['meanings'],
    });
  }

  async create(createWordDto: CreateWordDto): Promise<Word> {
    const { meanings, ...wordData } = createWordDto;
    const word = this.wordsRepository.create({
      ...wordData,
      meanings: meanings?.map((m) => {
        const meaning = new Meaning();
        meaning.meaning = m;
        return meaning;
      }),
    });
    return this.wordsRepository.save(word);
  }

  async update(id: string, updateWordDto: UpdateWordDto): Promise<Word | null> {
    const word = await this.wordsRepository.findOne({
      where: { id },
      relations: ['meanings'],
    });

    if (!word) {
      return null;
    }

    const { meanings, ...wordData } = updateWordDto;

    this.wordsRepository.merge(word, wordData);

    if (meanings) {
      // Delete existing meanings to avoid orphans and duplicates
      await this.wordsRepository.manager.delete(Meaning, { word: { id } });

      // Assign new meanings
      word.meanings = meanings.map((m) => {
        const meaning = new Meaning();
        meaning.meaning = m;
        meaning.word = word;
        return meaning;
      });
    }

    return this.wordsRepository.save(word);
  }

  async delete(id: string): Promise<void> {
    await this.wordsRepository.delete(id);
  }
}

