import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prompt, Prisma } from '@prisma/client';

@Injectable()
export class PromptService {
    constructor(private prisma: PrismaService) { }

    async prompt(
        promptWhereUniqueInput: Prisma.PromptWhereUniqueInput,
    ): Promise<Prompt | null> {
        return this.prisma.prompt.findUnique({
            where: promptWhereUniqueInput,
        });
    }
    
    async prompts(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.PromptWhereUniqueInput;
        where?: Prisma.PromptWhereInput;
        orderBy?: Prisma.PromptOrderByWithRelationInput;
    }): Promise<Prompt[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.prompt.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    async createPrompt(data: Prisma.PromptCreateInput): Promise<Prompt> {
        return this.prisma.prompt.create({
            data,
        });
    }

    async updatePrompt(params: {
        where: Prisma.PromptWhereUniqueInput;
        data: Prisma.PromptUpdateInput;
    }): Promise<Prompt> {
        const { where, data } = params;
        return this.prisma.prompt.update({
            data,
            where,
        });
    }
    

    async deletePrompt(where: Prisma.PromptWhereUniqueInput): Promise<Prompt> {
        return this.prisma.prompt.delete({
            where,
        });
    }
}