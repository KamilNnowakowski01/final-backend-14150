import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { User } from '../users/user.entity';
import { Word } from '../words/word.entity';
import { FlashcardsItem } from '../flashcards-items/flashcards-item.entity';

@Entity('repetitions')
export class Repetition {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_users' })
  @Column({ name: 'id_users' })
  @Expose({ name: 'id_users', groups: ['detail'] })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_words' })
  @Column({ name: 'id_words' })
  @Expose({ name: 'id_words', groups: ['detail'] })
  wordId: string;

  @ApiProperty({ example: 2.5 })
  @Column('float', { name: 'easiness_factor', default: 2.5 })
  @Expose({ name: 'easiness_factor' })
  easinessFactor: number;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  repetitions: number;

  @ApiProperty({ example: 0 })
  @Column({ name: 'next_interval', default: 0 })
  @Expose({ name: 'next_interval' })
  nextInterval: number;

  @ApiProperty()
  @Column({ name: 'date_next_rep', type: 'timestamptz', default: () => "date_trunc('day', now())" })
  @Expose({ name: 'date_next_rep' })
  dateNextRep: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'date_last_rep', type: 'timestamptz', nullable: true })
  @Expose({ name: 'date_last_rep' })
  dateLastRep: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.repetitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_users' })
  user: User;

  @Expose({ groups: ['detail'] })
  @ManyToOne(() => Word, (word) => word.repetitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_words' })
  word: Word;

  @OneToMany(() => FlashcardsItem, (item) => item.repetition)
  items: FlashcardsItem[];
}
