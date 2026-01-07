import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Kowalski' })
  @IsString()
  @IsNotEmpty()
  surname: string;
}
