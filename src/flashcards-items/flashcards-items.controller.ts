import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FlashcardsItemsService } from './flashcards-items.service';
import { FlashcardsItem } from './flashcards-item.entity';
import { CreateFlashcardsItemDto } from './dto/create-flashcards-item.dto';
import { UpdateFlashcardsItemDto } from './dto/update-flashcards-item.dto';
import { SendScoreDto } from './dto/send-score.dto';
import { OwnerGuard } from '../auth/owner.guard';

@ApiTags('flashcards-items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OwnerGuard)
@Controller('users/:userId/flashcards-sessions/:sessionId/items')
export class FlashcardsItemsController {
  constructor(private readonly itemsService: FlashcardsItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new flashcards item' })
  @ApiResponse({ status: 201, description: 'The item has been successfully created.', type: FlashcardsItem })
  create(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() createDto: CreateFlashcardsItemDto,
  ) {
    return this.itemsService.create({ ...createDto, sessionId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all items for a session' })
  @ApiResponse({ status: 200, description: 'Return all items.', type: [FlashcardsItem] })
  findAll(@Param('userId') userId: string, @Param('sessionId') sessionId: string) {
    return this.itemsService.findAllBySession(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by id' })
  @ApiResponse({ status: 200, description: 'Return the item.', type: FlashcardsItem })
  findOne(@Param('userId') userId: string, @Param('sessionId') sessionId: string, @Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'The item has been successfully updated.', type: FlashcardsItem })
  update(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateFlashcardsItemDto,
  ) {
    return this.itemsService.update(id, updateDto);
  }

  @Post(':id/send-score')
  @ApiOperation({ summary: 'Send score for a flashcard item (SM-2 algorithm)' })
  @ApiResponse({ status: 200, description: 'The item has been updated with new stage and repetition data.', type: FlashcardsItem })
  sendScore(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('id') id: string,
    @Body() sendScoreDto: SendScoreDto,
  ) {
    return this.itemsService.sendScore(id, sendScoreDto.score);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'The item has been successfully deleted.' })
  remove(@Param('userId') userId: string, @Param('sessionId') sessionId: string, @Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
