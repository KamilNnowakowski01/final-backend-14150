import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateQuizzesSessionDto {
  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ required: false, name: 'date_started' })
  @IsDateString()
  @IsOptional()
  @Expose({ name: 'date_started' })
  startedAt?: string;

  @ApiProperty({ required: false, name: 'date_ended' })
  @IsDateString()
  @IsOptional()
  @Expose({ name: 'date_ended' })
  endedAt?: string;
}
