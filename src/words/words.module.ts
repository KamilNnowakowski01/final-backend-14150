import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordsService } from './words.service';
import { Word } from './word.entity';
import { WordsController } from './words.controller';
import { Meaning } from './meaning.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Word, Meaning])],
  controllers: [WordsController],
  providers: [WordsService],
})
export class WordsModule {}
