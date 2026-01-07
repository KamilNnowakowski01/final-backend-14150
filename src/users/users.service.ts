import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getUserLimits(userId: string): Promise<{ dailyReview: number; dailyNew: number }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    return {
      dailyReview: user?.dailyReviewLimit ?? 50,
      dailyNew: user?.dailyNewLimit ?? 10,
    };
  }

  async getLearningStrategy(userId: string): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user?.learningStrategy || 'random';
  }
}
