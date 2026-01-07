import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Repetition } from '../repetitions/repetition.entity';
import { FlashcardsSession } from '../flashcards-sessions/flashcards-session.entity';

@Entity('profiles')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ name: 'daily_new_limit', default: 10 })
  dailyNewLimit: number;

  @Column({ name: 'daily_review_limit', default: 50 })
  dailyReviewLimit: number;

  @Column({ name: 'learning_strategy', default: 'random' })
  learningStrategy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Repetition, (repetition) => repetition.user)
  repetitions: Repetition[];

  @OneToMany(() => FlashcardsSession, (session) => session.user)
  flashcardsSessions: FlashcardsSession[];
}
