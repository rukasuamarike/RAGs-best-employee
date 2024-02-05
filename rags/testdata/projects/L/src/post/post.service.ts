import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) { }

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRealPost(data: Prisma.PostCreateInput): Promise<Post> {
    try {
      return this.prisma.post.create({
        data,
      })
    } catch (error) { console.log("err:", data); return; }
  }
  async createPost(post: any, promptId: any): Promise<Post> {
    console.log
    return this.createRealPost({
      title: post.title,
      body: post.body,
      imgDesc: post.imgDesc,
      prompt: {
        connect: { id: promptId }
      },
      keywords: post.keywords,
      link: post.link,
      hashtags: post.hashtags
    })
  }


  async updateRealPost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }
  async updatePost(post: any, photoId, promptId: any): Promise<Post> {
    return this.updateRealPost({
      where: { id: post.id }, data: {
        title: post.title,
        body: post.body,
        imgDesc: post.imgDesc,
        prompt: {
          connect: { id: promptId }
        },
        photos: {
          connect: { id: photoId }
        },
        keywords: post.keywords,
        link: post.link,
        hashtags: post.hashtags
      }
    })
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}