import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizzesPackage } from './quizzes-package.entity';
import { CreateQuizzesPackageDto } from './dto/create-quizzes-package.dto';
import { UpdateQuizzesPackageDto } from './dto/update-quizzes-package.dto';

@Injectable()
export class QuizzesPackagesService {
  constructor(
    @InjectRepository(QuizzesPackage)
    private packagesRepository: Repository<QuizzesPackage>,
  ) {}

  async create(createDto: CreateQuizzesPackageDto): Promise<QuizzesPackage> {
    const pkg = this.packagesRepository.create(createDto);
    return this.packagesRepository.save(pkg);
  }

  async findAllBySession(sessionId: string): Promise<QuizzesPackage[]> {
    return this.packagesRepository.find({
      where: { sessionId },
      relations: ['items'],
    });
  }

  async findOne(id: string): Promise<QuizzesPackage> {
    const pkg = await this.packagesRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!pkg) {
      throw new NotFoundException(`QuizzesPackage with ID ${id} not found`);
    }
    return pkg;
  }

  async update(id: string, updateDto: UpdateQuizzesPackageDto): Promise<QuizzesPackage> {
    const pkg = await this.findOne(id);
    Object.assign(pkg, updateDto);
    return this.packagesRepository.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packagesRepository.remove(pkg);
  }
}
