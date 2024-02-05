import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { Injectable } from '@nestjs/common';
import { PostController } from './post.controller';

@Injectable()
@Module({
  controllers: [PostController],
  providers: [PostService],

})
export class PostModule {}
