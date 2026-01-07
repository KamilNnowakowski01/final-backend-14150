import { ApiProperty } from '@nestjs/swagger';
import { QuizzesSession } from '../quizzes-session.entity';

export class GetQuizzesSessionsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', name: 'id_users' })
  id_users: string;

  @ApiProperty({ type: [QuizzesSession] })
  sessions: QuizzesSession[];
}
