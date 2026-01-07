import { Controller, Post, Body, Get, UseGuards, Request, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
    examples: {
      admin: {
        summary: 'Admin Account',
        description: 'Login as an administrator',
        value: {
          email: 'kamil.nowakowski.26kn@gmail.com',
          password: 'kamil.nowakowski.26kn@gmail.com',
        },
      },
      user: {
        summary: 'User Account',
        description: 'Login as a regular user',
        value: {
          email: 'nowakooo26x@gmail.com',
          password: 'nowakooo26x@gmail.com',
        },
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Delete('profile/delete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteAccount(@Request() req) {
    return this.authService.deleteAccount(req.user.id);
  }

  @Patch('profile/settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user learning settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully.' })
  async updateSettings(@Request() req, @Body() settings: UpdateSettingsDto) {
    return this.authService.updateSettings(req.user.id, settings);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user session info' })
  @ApiResponse({ status: 200, description: 'Return current user session info.' })
  getMe(@Request() req) {
    return req.user;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile from database' })
  @ApiResponse({ status: 200, description: 'Return current user profile.' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
