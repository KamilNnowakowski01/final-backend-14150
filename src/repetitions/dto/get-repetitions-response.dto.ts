import { ApiProperty } from '@nestjs/swagger';
import { Repetition } from '../repetition.entity';

export class GetRepetitionsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id_users: string;

  @ApiProperty({ type: [Repetition] })
  repetitions: Repetition[];
}
