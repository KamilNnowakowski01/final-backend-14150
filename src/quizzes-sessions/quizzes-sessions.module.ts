import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesSessionsService } from './quizzes-sessions.service';
import { QuizzesSessionsController } from './quizzes-sessions.controller';
import { QuizzesSession } from './quizzes-session.entity';
import { QuizzesPackage } from '../quizzes-packages/quizzes-package.entity';
import { Word } from '../words/word.entity';
import { AiGeneratorModule } from '../ai-generator/ai-generator.module';
import { QuizzesItem } from '../quizzes-items/quizzes-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizzesSession, QuizzesPackage, Word, QuizzesItem]),
    AiGeneratorModule,
  ],
  controllers: [QuizzesSessionsController],
  providers: [QuizzesSessionsService],
  exports: [QuizzesSessionsService],
})
export class QuizzesSessionsModule {}
