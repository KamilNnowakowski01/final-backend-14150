import { PartialType } from '@nestjs/swagger';
import { CreateQuizzesPackageDto } from './create-quizzes-package.dto';

export class UpdateQuizzesPackageDto extends PartialType(CreateQuizzesPackageDto) {}
