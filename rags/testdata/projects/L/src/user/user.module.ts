import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { Injectable } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'L/src/prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule { }
