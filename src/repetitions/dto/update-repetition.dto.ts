import { PartialType } from '@nestjs/swagger';
import { CreateRepetitionDto } from './create-repetition.dto';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateRepetitionDto extends PartialType(CreateRepetitionDto) {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  @Expose({ name: 'date_last_rep' })
  dateLastRep?: string;
}
