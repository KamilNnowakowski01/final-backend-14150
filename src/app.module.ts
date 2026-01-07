import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WordsModule } from './words/words.module';
import { RepetitionsModule } from './repetitions/repetitions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FlashcardsSessionsModule } from './flashcards-sessions/flashcards-sessions.module';
import { FlashcardsItemsModule } from './flashcards-items/flashcards-items.module';
import { QuizzesSessionsModule } from './quizzes-sessions/quizzes-sessions.module';
import { QuizzesPackagesModule } from './quizzes-packages/quizzes-packages.module';
import { QuizzesItemsModule } from './quizzes-items/quizzes-items.module';
import { AiGeneratorModule } from './ai-generator/ai-generator.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    WordsModule,
    RepetitionsModule,
    UsersModule,
    AuthModule,
    FlashcardsSessionsModule,
    FlashcardsItemsModule,
    QuizzesSessionsModule,
    QuizzesPackagesModule,
    QuizzesItemsModule,
    AiGeneratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


