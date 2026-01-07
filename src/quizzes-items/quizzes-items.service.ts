import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizzesItem } from './quizzes-item.entity';
import { CreateQuizzesItemDto } from './dto/create-quizzes-item.dto';
import { UpdateQuizzesItemDto } from './dto/update-quizzes-item.dto';

@Injectable()
export class QuizzesItemsService {
  constructor(
    @InjectRepository(QuizzesItem)
    private itemsRepository: Repository<QuizzesItem>,
  ) {}

  async create(createDto: CreateQuizzesItemDto): Promise<QuizzesItem> {
    const item = this.itemsRepository.create(createDto);
    return this.itemsRepository.save(item);
  }

  async findAllByPackage(packageId: string): Promise<QuizzesItem[]> {
    return this.itemsRepository.find({ where: { packageId } });
  }

  async findOne(id: string): Promise<QuizzesItem> {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`QuizzesItem with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, updateDto: UpdateQuizzesItemDto): Promise<QuizzesItem> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.itemsRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.itemsRepository.remove(item);
  }
}
