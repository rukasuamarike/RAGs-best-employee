import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { PrismaService } from 'L/src/prisma/prisma.service';
import { PromptService } from 'L/src/prompt/prompt.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, PrismaService, PromptService],
})
export class ImagesModule { }
