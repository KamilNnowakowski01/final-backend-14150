
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @ApiProperty({ example: 'uuid-of-item' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  answer: string;
}

export class SubmitPackageDto {
  @ApiProperty({ example: 'uuid-of-package' })
  @IsString()
  packageId: string;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
