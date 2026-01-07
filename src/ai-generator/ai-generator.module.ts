import { Module } from '@nestjs/common';
import { AiGeneratorService } from './ai-generator.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AiGeneratorService],
  exports: [AiGeneratorService],
})
export class AiGeneratorModule {}
