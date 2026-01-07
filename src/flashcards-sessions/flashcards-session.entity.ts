import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { User } from '../users/user.entity';
import { FlashcardsItem } from '../flashcards-items/flashcards-item.entity';

@Entity('flashcards_sessions')
export class FlashcardsSession {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_users' })
  @Column({ name: 'id_users' })
  @Expose({ name: 'id_users', groups: ['detail'] })
  userId: string;

  @ApiProperty({ example: 'learning', required: false })
  @Column({ type: 'text', nullable: true })
  type: string;

  @ApiProperty({ example: 'completed' })
  @Column({ type: 'text' })
  status: string;

  @ApiProperty({ name: 'date_started' })
  @CreateDateColumn({ name: 'date_started', type: 'timestamptz' })
  @Expose({ name: 'date_started' })
  startedAt: Date;

  @ApiProperty({ name: 'date_ended', required: false })
  @Column({ name: 'date_ended', type: 'timestamptz', nullable: true })
  @Expose({ name: 'date_ended' })
  endedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.flashcardsSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_users' })
  user: User;

  @Expose({ groups: ['detail'] })
  @OneToMany(() => FlashcardsItem, (item) => item.session)
  items: FlashcardsItem[];
}
