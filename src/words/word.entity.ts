import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Meaning } from './meaning.entity';
import { Repetition } from '../repetitions/repetition.entity';

@Entity('words')
export class Word {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'A1' })
  @Column()
  level: string;

  @ApiProperty({ example: ['noun'], required: false, name: 'part_of_speech' })
  @Column('text', { array: true, nullable: true, name: 'part_of_speech' })
  @Expose({ name: 'part_of_speech' })
  partOfSpeech: string[];

  @ApiProperty({ example: 'apple' })
  @Column({ unique: true })
  word: string;

  @ApiProperty({ example: '/ˈæp.əl/' })
  @Column()
  pronunciation: string;

  @ApiProperty({ name: 'created_at' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ type: () => [Meaning], required: false })
  @Expose()
  @OneToMany(() => Meaning, (meaning) => meaning.word, { cascade: true })
  meanings: Meaning[];

  @OneToMany(() => Repetition, (repetition) => repetition.word)
  repetitions: Repetition[];
}
