import { IsString, IsUUID, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashcardsItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the session' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the repetition' })
  @IsUUID()
  @IsNotEmpty()
  repetitionId: string;

  @ApiProperty({ example: 'new', description: "Status of the item: 'new' | 'review'" })
  @IsString()
  @IsNotEmpty()
  @IsIn(['new', 'review'])
  status: string;

  @ApiProperty({ example: 'learning', description: "Stage of the item: 'review' | 'learning' | 'passed'" })
  @IsString()
  @IsNotEmpty()
  @IsIn(['review', 'learning', 'passed'])
  stage: string;
}
