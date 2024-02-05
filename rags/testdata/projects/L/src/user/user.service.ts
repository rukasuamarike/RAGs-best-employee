import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { SkipAuth } from 'L/src/auth/auth.guard';
const bcrypt = require('bcrypt');
const saltRounds = 10;
@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async findOne(
        userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput,
        });
    }
    @SkipAuth()
    async createPass(plain) {
        return await bcrypt.hash(plain, saltRounds, function (err, hash) {
            return hash;
        });
    }
    async checkPass(hash, plain): Promise<boolean> {

        const pass: boolean = await new Promise((resolve, reject) => {
            bcrypt.compare(plain, hash, function (err, result) {
                if (err) reject(err)
                resolve(result)
            });
        })
        return pass;

    }
    async users(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async updateUser(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        const { where, data } = params;
        return this.prisma.user.update({
            data,
            where,
        });
    }

    async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
        return this.prisma.user.delete({
            where,
        });
    }
}