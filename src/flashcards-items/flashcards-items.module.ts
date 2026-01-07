import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardsItemsService } from './flashcards-items.service';
import { FlashcardsItemsController } from './flashcards-items.controller';
import { FlashcardsItem } from './flashcards-item.entity';
import { Repetition } from '../repetitions/repetition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FlashcardsItem, Repetition])],
  controllers: [FlashcardsItemsController],
  providers: [FlashcardsItemsService],
  exports: [FlashcardsItemsService],
})
export class FlashcardsItemsModule {}
