import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaController } from './prisma.controller';
import { UserService } from 'L/src/user/user.service';
import { PostService } from 'L/src/post/post.service';
import { PromptsService } from 'L/src/prompts/prompts.service';

@Module({
  providers: [PrismaService, UserService, PostService, PromptsService],
  controllers: [PrismaController],
  exports: [PrismaService]
})

export class PrismaModule { }
