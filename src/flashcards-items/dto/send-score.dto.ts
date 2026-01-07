import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendScoreDto {
  @ApiProperty({ example: 5, description: 'Score for the flashcard item (0-5)' })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsNotEmpty()
  score: number;
}
