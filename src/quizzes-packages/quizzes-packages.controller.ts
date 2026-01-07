import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesPackagesService } from './quizzes-packages.service';
import { QuizzesPackage } from './quizzes-package.entity';
import { CreateQuizzesPackageDto } from './dto/create-quizzes-package.dto';
import { UpdateQuizzesPackageDto } from './dto/update-quizzes-package.dto';
import { OwnerGuard } from '../auth/owner.guard';

@ApiTags('quizzes-packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OwnerGuard)
@Controller('users/:userId/quizzes-sessions/:sessionId/packages')
export class QuizzesPackagesController {
  constructor(private readonly packagesService: QuizzesPackagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quizzes package' })
  @ApiResponse({ status: 201, description: 'The package has been successfully created.', type: QuizzesPackage })
  create(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() createDto: CreateQuizzesPackageDto,
  ) {
    return this.packagesService.create({ ...createDto, sessionId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all packages for a session' })
  @ApiResponse({ status: 200, description: 'Return all packages.', type: [QuizzesPackage] })
  findAll(@Param('userId') userId: string, @Param('sessionId') sessionId: string) {
    return this.packagesService.findAllBySession(sessionId);
  }

  @Get(':id')
  @SerializeOptions({ groups: ['detail'] })
  @ApiOperation({ summary: 'Get a package by id' })
  @ApiResponse({ status: 200, description: 'Return the package.', type: QuizzesPackage })
  findOne(@Param('userId') userId: string, @Param('sessionId') sessionId: string, @Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a package' })
  @ApiResponse({ status: 200, description: 'The package has been successfully updated.', type: QuizzesPackage })
  update(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateQuizzesPackageDto,
  ) {
    return this.packagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a package' })
  @ApiResponse({ status: 200, description: 'The package has been successfully deleted.' })
  remove(@Param('userId') userId: string, @Param('sessionId') sessionId: string, @Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
