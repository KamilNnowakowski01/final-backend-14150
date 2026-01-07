import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token returned from login',
    example: '...refresh token string...',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
