import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude, Type } from 'class-transformer';
import { QuizzesSession } from '../quizzes-sessions/quizzes-session.entity';
import { QuizzesItem } from '../quizzes-items/quizzes-item.entity';

@Entity('quizzes_packages')
export class QuizzesPackage {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  @Expose({ groups: ['detail'] })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_quizzes_sessions' })
  @Column({ name: 'id_quizzes_sessions' })
  @Expose({ name: 'id_quizzes_sessions', groups: ['detail'] })
  sessionId: string;

  @ApiProperty({ example: 'package-1', description: "Allowed values: 'package-1', 'package-2', 'package-3'" })
  @Column()
  @Expose({ groups: ['detail'] })
  package: string;

  @ApiProperty({ example: 'A1-A2', description: "Allowed values: 'A1-A2', 'B1-B2', 'C1-C2'", required: false })
  @Column({ nullable: true })
  @Expose({ groups: ['detail'] })
  level: string;

  @ApiProperty({ name: 'created_at' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Exclude()
  @ManyToOne(() => QuizzesSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_quizzes_sessions' })
  session: QuizzesSession;

  @ApiProperty({ type: () => [QuizzesItem] })
  @OneToMany(() => QuizzesItem, (item) => item.package)
  @Expose()
  @Type(() => QuizzesItem)
  items: QuizzesItem[];
}
