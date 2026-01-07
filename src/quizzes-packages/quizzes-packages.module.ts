import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesPackagesService } from './quizzes-packages.service';
import { QuizzesPackagesController } from './quizzes-packages.controller';
import { QuizzesPackage } from './quizzes-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuizzesPackage])],
  controllers: [QuizzesPackagesController],
  providers: [QuizzesPackagesService],
  exports: [QuizzesPackagesService],
})
export class QuizzesPackagesModule {}
