import { PartialType } from '@nestjs/swagger';
import { CreateFlashcardsItemDto } from './create-flashcards-item.dto';

export class UpdateFlashcardsItemDto extends PartialType(CreateFlashcardsItemDto) {}
