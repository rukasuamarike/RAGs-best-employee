import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';
import { PrismaService } from 'L/src/prisma/prisma.service';

@Module({
  controllers: [PromptController],
  providers: [PromptService, PrismaService],
})
export class PromptModule { }
