import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { QuizzesPackage } from '../quizzes-packages/quizzes-package.entity';
import { Word } from '../words/word.entity';

@Entity('quizzes_items')
export class QuizzesItem {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_quizzes_packages' })
  @Column({ name: 'id_quizzes_packages' })
  @Expose({ name: 'id_quizzes_packages' })
  packageId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_words' })
  @Column({ name: 'id_words' })
  @Expose({ name: 'id_words' })
  wordId: string;

  @ApiProperty({ example: 'matching', description: "Allowed values: 'matching', 'synonimOrAntonym', 'clouze'" })
  @Column()
  @Expose()
  type: string;

  @ApiProperty({ example: 'What is the synonym of...' })
  @Column()
  @Expose()
  question: string;

  @ApiProperty({ example: 'A', description: "Allowed values: 'A', 'B', 'C'", name: 'correct_answer' })
  @Column({ name: 'correct_answer' })
  @Expose({ name: 'correct_answer' })
  correctAnswer: string;

  @ApiProperty({ example: 'Answer A', name: 'answer_a' })
  @Column({ name: 'answer_a' })
  @Expose({ name: 'answer_a' })
  answerA: string;

  @ApiProperty({ example: 'Answer B', name: 'answer_b' })
  @Column({ name: 'answer_b' })
  @Expose({ name: 'answer_b' })
  answerB: string;

  @ApiProperty({ example: 'Answer C', name: 'answer_c' })
  @Column({ name: 'answer_c' })
  @Expose({ name: 'answer_c' })
  answerC: string;

  @ApiProperty({ example: 'A', description: "Allowed values: 'A', 'B', 'C'", required: false, name: 'user_answer' })
  @Column({ name: 'user_answer', nullable: true })
  @Expose({ name: 'user_answer' })
  userAnswer: string;

  @ApiProperty({ name: 'created_at' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Exclude()
  @ManyToOne(() => QuizzesPackage, (pkg) => pkg.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_quizzes_packages' })
  package: QuizzesPackage;

  @Exclude()
  @ManyToOne(() => Word, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_words' })
  word: Word;
}
