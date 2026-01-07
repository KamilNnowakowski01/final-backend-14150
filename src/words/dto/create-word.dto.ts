import { IsString, IsOptional, IsArray } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWordDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  level: string;

  @ApiProperty({ name: 'part_of_speech', example: ['noun'], required: false })
  @IsArray()
  @IsOptional()
  @Expose({ name: 'part_of_speech' })
  partOfSpeech: string[];

  @ApiProperty({ example: 'apple' })
  @IsString()
  word: string;

  @ApiProperty({ example: '/ˈæp.əl/' })
  @IsString()
  pronunciation: string;

  @ApiProperty({ example: ['jabłko'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  meanings?: string[];
}
