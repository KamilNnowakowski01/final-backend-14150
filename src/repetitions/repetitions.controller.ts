import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, SerializeOptions, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RepetitionsService } from './repetitions.service';
import { Repetition } from './repetition.entity';
import { CreateRepetitionDto } from './dto/create-repetition.dto';
import { UpdateRepetitionDto } from './dto/update-repetition.dto';
import { OwnerGuard } from '../auth/owner.guard';
import { GetRepetitionsResponseDto } from './dto/get-repetitions-response.dto';
import { RepetitionsStatsResponseDto } from './dto/get-repetitions-stats-response.dto';

@ApiTags('repetitions')
@ApiBearerAuth() // Dodaje kłódkę w Swaggerze
@UseGuards(AuthGuard('jwt'), OwnerGuard) // Wymaga tokena ORAZ sprawdza czy user jest właścicielem lub adminem
@Controller('users/:userId/repetitions')
export class RepetitionsController {
  constructor(private readonly repetitionsService: RepetitionsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get repetitions statistics per level' })
  @ApiResponse({ status: 200, description: 'Return statistics.', type: RepetitionsStatsResponseDto })
  getStats(@Param('userId') userId: string) {
    return this.repetitionsService.getStats(userId);
  }

  @Get()
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Get all repetitions for a user' })
  @ApiQuery({ name: 'wordId', required: false, description: 'Filter by word ID' })
  @ApiResponse({ status: 200, description: 'Return all repetitions wrapped with user ID.', type: GetRepetitionsResponseDto })
  async findAll(@Param('userId') userId: string, @Query('wordId') wordId?: string) {
    const repetitions = await this.repetitionsService.findAll(userId, wordId);
    return {
      id_users: userId,
      repetitions: repetitions,
    };
  }

  @Get(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Get a repetition by id' })
  @ApiResponse({ status: 200, description: 'Return the repetition.', type: Repetition })
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.repetitionsService.findOne(id, userId);
  }

  @Post()
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Create a new repetition' })
  @ApiResponse({ status: 201, description: 'The repetition has been successfully created.', type: Repetition })
  create(@Param('userId') userId: string, @Body() createRepetitionDto: CreateRepetitionDto) {
    return this.repetitionsService.create(userId, createRepetitionDto);
  }

  @Put(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Update a repetition' })
  @ApiResponse({ status: 200, description: 'The repetition has been successfully updated.', type: Repetition })
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() updateRepetitionDto: UpdateRepetitionDto) {
    return this.repetitionsService.update(id, userId, updateRepetitionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repetition' })
  @ApiResponse({ status: 200, description: 'The repetition has been successfully deleted.' })
  delete(@Param('userId') userId: string, @Param('id') id: string) {
    return this.repetitionsService.delete(id, userId);
  }
}
