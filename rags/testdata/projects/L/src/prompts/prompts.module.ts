import { Module } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { PromptService } from 'L/src/prompt/prompt.service';
import { PostService } from 'L/src/post/post.service';
import { ImagesService } from 'L/src/images/images.service';
import { UserService } from 'L/src/user/user.service';
import { PrismaService } from 'L/src/prisma/prisma.service';
import { PrismaModule } from 'L/src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromptsController],
  providers: [PromptsService, PromptService, PostService, ImagesService, UserService, PrismaService],
})
export class PromptsModule { }
