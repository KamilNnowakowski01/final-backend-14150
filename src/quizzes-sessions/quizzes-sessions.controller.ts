import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesSessionsService } from './quizzes-sessions.service';
import { QuizzesSession } from './quizzes-session.entity';
import { CreateQuizzesSessionDto } from './dto/create-quizzes-session.dto';
import { UpdateQuizzesSessionDto } from './dto/update-quizzes-session.dto';
import { SubmitPackageDto } from './dto/submit-package.dto';
import { SubmitPackageResultDto } from './dto/submit-package-result.dto';
import { OwnerGuard } from '../auth/owner.guard';
import { GetQuizzesSessionsResponseDto } from './dto/get-quizzes-sessions-response.dto';

@ApiTags('quizzes-sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OwnerGuard)
@Controller('users/:userId/quizzes-sessions')
export class QuizzesSessionsController {
  constructor(private readonly sessionsService: QuizzesSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all quizzes sessions for a user' })
  @ApiResponse({ status: 200, description: 'Return all sessions wrapped with user ID.', type: GetQuizzesSessionsResponseDto })
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
  @ApiResponse({ status: 200, description: 'Return the session.', type: QuizzesSession })
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.sessionsService.findOne(id, userId);
  }

  @Post('start')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Start a new quiz session or continue today\'s session' })
  @ApiResponse({ status: 201, description: 'The session has been started or retrieved.', type: QuizzesSession })
  startSession(@Param('userId') userId: string) {
    return this.sessionsService.startSession(userId);
  }

  @Post('next-package')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Generate and retrieve the next package for the active session' })
  @ApiResponse({ status: 201, description: 'The next package has been generated.', type: QuizzesSession }) // Note: Ideally should return QuizzesPackage type in docs
  generateNextPackage(@Param('userId') userId: string) {
    return this.sessionsService.generateNextPackage(userId);
  }

  @Post('submit-package')
  @ApiOperation({ summary: 'Submit answers for a package' })
  @ApiResponse({ status: 201, description: 'Answers submitted and score calculated.', type: SubmitPackageResultDto })
  submitPackage(@Param('userId') userId: string, @Body() submitDto: SubmitPackageDto) {
    return this.sessionsService.submitPackage(userId, submitDto);
  }

  @Post('finish')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Finish the active session' })
  @ApiResponse({ status: 200, description: 'The session has been completed.', type: QuizzesSession })
  finishSession(@Param('userId') userId: string) {
    return this.sessionsService.finishSession(userId);
  }

  @Post()
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'The session has been successfully created.', type: QuizzesSession })
  create(@Param('userId') userId: string, @Body() createDto: CreateQuizzesSessionDto) {
    return this.sessionsService.create(userId, createDto);
  }

  @Put(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Update a session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully updated.', type: QuizzesSession })
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() updateDto: UpdateQuizzesSessionDto) {
    return this.sessionsService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully deleted.' })
  delete(@Param('userId') userId: string, @Param('id') id: string) {
    return this.sessionsService.delete(id, userId);
  }
}
