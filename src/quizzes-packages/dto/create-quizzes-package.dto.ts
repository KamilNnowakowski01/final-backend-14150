import { IsString, IsUUID, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizzesPackageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the quizzes session' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'package-1', description: "Allowed values: 'package-1', 'package-2', 'package-3'" })
  @IsString()
  @IsNotEmpty()
  @IsIn(['package-1', 'package-2', 'package-3'])
  package: string;

  @ApiProperty({ example: 'A1-A2', description: "Allowed values: 'A1-A2', 'B1-B2', 'C1-C2'", required: false })
  @IsString()
  @IsOptional()
  @IsIn(['A1-A2', 'B1-B2', 'C1-C2'])
  level?: string;
}
