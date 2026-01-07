import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FlashcardsSessionsService } from './flashcards-sessions.service';
import { FlashcardsSession } from './flashcards-session.entity';
import { CreateFlashcardsSessionDto } from './dto/create-flashcards-session.dto';
import { UpdateFlashcardsSessionDto } from './dto/update-flashcards-session.dto';
import { OwnerGuard } from '../auth/owner.guard';
import { GetFlashcardsSessionsResponseDto } from './dto/get-flashcards-sessions-response.dto';

@ApiTags('flashcards-sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OwnerGuard)
@Controller('users/:userId/flashcards-sessions')
export class FlashcardsSessionsController {
  constructor(private readonly sessionsService: FlashcardsSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all flashcards sessions for a user' })
  @ApiResponse({ status: 200, description: 'Return all sessions wrapped with user ID.', type: GetFlashcardsSessionsResponseDto })
  async findAll(@Param('userId') userId: string) {
    const sessions = await this.sessionsService.findAll(userId);
    return {
      id_users: userId,
      sessions: sessions,
    };
  }

  @Get(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Get a session by id' })
  @ApiResponse({ status: 200, description: 'Return the session.', type: FlashcardsSession })
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.sessionsService.findOne(id, userId);
  }

  @Post('start')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Start a new session or continue today\'s session' })
  @ApiResponse({ status: 201, description: 'The session has been started or retrieved.', type: FlashcardsSession })
  startSession(@Param('userId') userId: string) {
    return this.sessionsService.startSession(userId);
  }

  @Post('finish')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Finish the current session if all items are passed' })
  @ApiResponse({ status: 200, description: 'The session has been successfully finished.', type: FlashcardsSession })
  finishSession(@Param('userId') userId: string) {
    return this.sessionsService.finishSession(userId);
  }

  @Post()
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Create a new session with default values' })
  @ApiResponse({ status: 201, description: 'The session has been successfully created.', type: FlashcardsSession })
  create(@Param('userId') userId: string) {
    return this.sessionsService.create(userId, {
      type: 'default',
      status: 'active',
    } as CreateFlashcardsSessionDto);
  }

  @Put(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Update a session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully updated.', type: FlashcardsSession })
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() updateDto: UpdateFlashcardsSessionDto) {
    return this.sessionsService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully deleted.' })
  delete(@Param('userId') userId: string, @Param('id') id: string) {
    return this.sessionsService.delete(id, userId);
  }
}
