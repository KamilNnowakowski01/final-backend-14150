import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepetitionsService } from './repetitions.service';
import { RepetitionsController } from './repetitions.controller';
import { Repetition } from './repetition.entity';
import { Word } from '../words/word.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Repetition, Word])],
  providers: [RepetitionsService],
  controllers: [RepetitionsController],
  exports: [RepetitionsService],
})
export class RepetitionsModule {}
