import { IsString, IsUUID, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizzesItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the quizzes package' })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the word' })
  @IsUUID()
  @IsNotEmpty()
  wordId: string;

  @ApiProperty({ example: 'matching', description: "Allowed values: 'matching', 'synonimOrAntonym', 'clouze'" })
  @IsString()
  @IsNotEmpty()
  @IsIn(['matching', 'synonimOrAntonym', 'clouze'])
  type: string;

  @ApiProperty({ example: 'What is the synonym of...' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'A', description: "Allowed values: 'A', 'B', 'C'" })
  @IsString()
  @IsNotEmpty()
  @IsIn(['A', 'B', 'C'])
  correctAnswer: string;

  @ApiProperty({ example: 'Answer A' })
  @IsString()
  @IsNotEmpty()
  answerA: string;

  @ApiProperty({ example: 'Answer B' })
  @IsString()
  @IsNotEmpty()
  answerB: string;

  @ApiProperty({ example: 'Answer C' })
  @IsString()
  @IsNotEmpty()
  answerC: string;

  @ApiProperty({ example: 'A', description: "Allowed values: 'A', 'B', 'C'", required: false })
  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  userAnswer?: string;
}
