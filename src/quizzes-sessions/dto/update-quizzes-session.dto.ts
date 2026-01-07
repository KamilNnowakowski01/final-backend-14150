import { PartialType } from '@nestjs/swagger';
import { CreateQuizzesSessionDto } from './create-quizzes-session.dto';

export class UpdateQuizzesSessionDto extends PartialType(CreateQuizzesSessionDto) {}
