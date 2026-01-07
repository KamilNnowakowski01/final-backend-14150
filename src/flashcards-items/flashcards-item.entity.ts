import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { FlashcardsSession } from '../flashcards-sessions/flashcards-session.entity';
import { Repetition } from '../repetitions/repetition.entity';

@Entity('flashcards_items')
export class FlashcardsItem {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_sessions' })
  @Column({ name: 'id_sessions' })
  @Expose({ name: 'id_sessions', groups: ['detail'] })
  sessionId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_repetitions' })
  @Column({ name: 'id_repetitions' })
  @Expose({ name: 'id_repetitions', groups: ['detail'] })
  repetitionId: string;

  @ApiProperty({ example: 'new', description: "Allowed values: 'new', 'review'" })
  @Column()
  status: string;

  @ApiProperty({ example: 'learning', description: "Allowed values: 'review', 'learning', 'passed'" })
  @Column()
  stage: string;

  @Exclude()
  @ManyToOne(() => FlashcardsSession, (session) => session.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sessions' })
  session: FlashcardsSession;

  @Expose({ groups: ['detail'] })
  @ManyToOne(() => Repetition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_repetitions' })
  repetition: Repetition;
}
