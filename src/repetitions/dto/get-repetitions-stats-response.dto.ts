import { ApiProperty } from '@nestjs/swagger';

export class LevelStatsDto {
  @ApiProperty({ example: 'A1' })
  level: string;

  @ApiProperty({ example: 1500, description: 'Total words available in database for this level' })
  total: number;

  @ApiProperty({ example: 150, description: 'Total words user has started learning (learning + mastered)' })
  totalUser: number;

  @ApiProperty({ example: 45, description: 'Words with easiness factor < 2.8' })
  learning: number;

  @ApiProperty({ example: 105, description: 'Words with easiness factor >= 2.8' })
  mastered: number;
}

export class RepetitionsStatsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({
    description: 'Stats per level',
    example: {
      A1: { level: 'A1', total: 1500, totalUser: 150, learning: 45, mastered: 105 },
      B1: { level: 'B1', total: 2000, totalUser: 300, learning: 100, mastered: 200 },
    },
  })
  stats: { [key: string]: LevelStatsDto };
}
