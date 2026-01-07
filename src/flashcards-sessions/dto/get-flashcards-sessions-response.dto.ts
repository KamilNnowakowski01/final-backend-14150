import { ApiProperty } from '@nestjs/swagger';
import { FlashcardsSession } from '../flashcards-session.entity';

export class GetFlashcardsSessionsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id_users: string;

  @ApiProperty({ type: [FlashcardsSession] })
  sessions: FlashcardsSession[];
}
