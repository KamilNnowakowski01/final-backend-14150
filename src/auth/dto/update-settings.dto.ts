import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ example: 10, description: 'Daily limit for new words (5-50)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dailyNewLimit?: number;

  @ApiProperty({ example: 50, description: 'Daily limit for reviews (10-200)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  dailyReviewLimit?: number;

  @ApiProperty({ example: 'random', description: 'Learning strategy (random, level_a1, etc.)', required: false })
  @IsOptional()
  @IsString()
  learningStrategy?: string;
}
