import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardsSessionsService } from './flashcards-sessions.service';
import { FlashcardsSessionsController } from './flashcards-sessions.controller';
import { FlashcardsSession } from './flashcards-session.entity';
import { FlashcardsItem } from '../flashcards-items/flashcards-item.entity';
import { Word } from '../words/word.entity';
import { WordsStrategyFactory } from './strategies/words-strategy.factory';
import { RandomWordsStrategy } from './strategies/random-words.strategy';
import { LevelWordsStrategy } from './strategies/level-words.strategy';
import { RepetitionsModule } from '../repetitions/repetitions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashcardsSession, FlashcardsItem, Word]),
    RepetitionsModule,
    UsersModule,
  ],
  controllers: [FlashcardsSessionsController],
  providers: [
    FlashcardsSessionsService,
    WordsStrategyFactory,
    RandomWordsStrategy,
    LevelWordsStrategy,
  ],
  exports: [FlashcardsSessionsService],
})
export class FlashcardsSessionsModule {}
