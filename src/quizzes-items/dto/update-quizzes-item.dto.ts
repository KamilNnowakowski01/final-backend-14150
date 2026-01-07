import { PartialType } from '@nestjs/swagger';
import { CreateQuizzesItemDto } from './create-quizzes-item.dto';

export class UpdateQuizzesItemDto extends PartialType(CreateQuizzesItemDto) {}
