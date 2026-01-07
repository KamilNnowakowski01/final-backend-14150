import { PartialType } from '@nestjs/swagger';
import { CreateFlashcardsSessionDto } from './create-flashcards-session.dto';

export class UpdateFlashcardsSessionDto extends PartialType(CreateFlashcardsSessionDto) {}
