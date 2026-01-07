import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesItemsService } from './quizzes-items.service';
import { QuizzesItemsController } from './quizzes-items.controller';
import { QuizzesItem } from './quizzes-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuizzesItem])],
  controllers: [QuizzesItemsController],
  providers: [QuizzesItemsService],
  exports: [QuizzesItemsService],
})
export class QuizzesItemsModule {}
