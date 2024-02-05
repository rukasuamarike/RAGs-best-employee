import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    Request,
} from '@nestjs/common';
import { UserService } from '../user/user.service'
import { PostService } from '../post/post.service';
import { User as UserModel, Post as PostModel } from '@prisma/client';


@Controller('prisma')
export class PrismaController {
    constructor(
        private readonly userService: UserService,
        private readonly postService: PostService,
    ) { }
    // @Get('post/:id')
    // async getPostById(@Param('id') id: string): Promise<PostModel> {
    //     return this.postService.post({ id: Number(id) });
    // }

    // @Get('feed/:firm')
    // async getPublishedPosts(@Param('firm') firm: string): Promise<PostModel[]> {
    //     return this.postService.posts({
    //         where: { author: { firmName: firm } },
    //     });
    // }

    @Get('filtered-posts/:searchString')
    async getFilteredPosts(
        @Param('searchString') searchString: string,
    ): Promise<PostModel[]> {
        return this.postService.posts({
            where: {
                OR: [
                    {
                        title: { contains: searchString },
                    },
                ],
            },
        });
    }
    @Get('users/all')
    async allUsers(): Promise<UserModel[]> {
        return this.userService.users({
            where: {
                email: {
                    not: "a"
                }
            }
        })
    }



    @Get('search-users/:searchString')
    async getFilteredUsers(
        @Param('searchString') searchString: string,
    ): Promise<UserModel[]> {
        return this.userService.users({
            where: {
                OR: [
                    {
                        email: { contains: searchString },
                    },
                    {
                        email: { contains: searchString },
                    },
                ],
            },
        });
    }

    // @Post('post')
    // async createDraft(
    //     @Body() postData: { title: string; body: string; authorEmail: string },
    // ): Promise<PostModel> {
    //     const { title, body, authorEmail } = postData;
    //     return this.postService.createPost({
    //         title,
    //         body,
    //         author: {
    //             connect: { email: authorEmail },
    //         }
    //     });
    // }

    @Post('user')
    async signupUser(
        @Body() userData: { name?: string; email: string, hash: string },
    ): Promise<UserModel> {
        return this.userService.createUser(userData);
    }

    // @Put('publish/:id')
    // async publishPost(@Param('id') id: string, @Request() req: any): Promise<PostModel> {
    //     return this.postService.updatePost({
    //         where: { id: Number(id) },
    //         data: { body: req.body.newbody },
    //     });
    // }

    // @Delete('post/:id')
    // async deletePost(@Param('id') id: string): Promise<PostModel> {
    //     return this.postService.deletePost({ id: Number(id) });
    // }
}

