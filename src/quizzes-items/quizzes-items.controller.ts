import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesItemsService } from './quizzes-items.service';
import { QuizzesItem } from './quizzes-item.entity';
import { CreateQuizzesItemDto } from './dto/create-quizzes-item.dto';
import { UpdateQuizzesItemDto } from './dto/update-quizzes-item.dto';
import { OwnerGuard } from '../auth/owner.guard';

@ApiTags('quizzes-items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OwnerGuard)
@Controller('users/:userId/quizzes-packages/:packageId/items')
export class QuizzesItemsController {
  constructor(private readonly itemsService: QuizzesItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quizzes item' })
  @ApiResponse({ status: 201, description: 'The item has been successfully created.', type: QuizzesItem })
  create(
    @Param('userId') userId: string,
    @Param('packageId') packageId: string,
    @Body() createDto: CreateQuizzesItemDto,
  ) {
    return this.itemsService.create({ ...createDto, packageId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all items for a package' })
  @ApiResponse({ status: 200, description: 'Return all items.', type: [QuizzesItem] })
  findAll(@Param('userId') userId: string, @Param('packageId') packageId: string) {
    return this.itemsService.findAllByPackage(packageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by id' })
  @ApiResponse({ status: 200, description: 'Return the item.', type: QuizzesItem })
  findOne(@Param('userId') userId: string, @Param('packageId') packageId: string, @Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'The item has been successfully updated.', type: QuizzesItem })
  update(
    @Param('userId') userId: string,
    @Param('packageId') packageId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateQuizzesItemDto,
  ) {
    return this.itemsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'The item has been successfully deleted.' })
  remove(@Param('userId') userId: string, @Param('packageId') packageId: string, @Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
