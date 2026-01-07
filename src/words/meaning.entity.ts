import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Word } from './word.entity';
import { Exclude } from 'class-transformer';

@Entity('meanings')
export class Meaning {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ name: 'id_words' })
  wordId: string;

  @ApiProperty({ example: 'jabłko' })
  @Column()
  meaning: string;

  @Exclude()
  @ManyToOne(() => Word, (word) => word.meanings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_words' })
  word: Word;
}
