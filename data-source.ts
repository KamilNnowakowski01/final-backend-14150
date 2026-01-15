import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './src/users/user.entity';
import { Word } from './src/words/word.entity';
import { Meaning } from './src/words/meaning.entity';
import { QuizzesPackage } from './src/quizzes-packages/quizzes-package.entity';
import { QuizzesSession } from './src/quizzes-sessions/quizzes-session.entity';
import { QuizzesItem } from './src/quizzes-items/quizzes-item.entity';
import { FlashcardsSession } from './src/flashcards-sessions/flashcards-session.entity';
import { FlashcardsItem } from './src/flashcards-items/flashcards-item.entity';
import { Repetition } from './src/repetitions/repetition.entity';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Word,
    Meaning,
    QuizzesPackage,
    QuizzesSession,
    QuizzesItem,
    FlashcardsSession,
    FlashcardsItem,
    Repetition,
  ],
  migrations: ['./migrations/*{.ts,.js}'],
  synchronize: true,
  ssl: { rejectUnauthorized: false },
});
