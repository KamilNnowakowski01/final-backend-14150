import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateRepetitionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  wordId: string;

  @ApiProperty({ example: 2.5, required: false })
  @IsNumber()
  @IsOptional()
  easinessFactor?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  repetitions?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  nextInterval?: number;

  @IsDateString()
  @IsOptional()
  dateNextRep?: string;
}
