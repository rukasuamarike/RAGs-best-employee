import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'L/src/prisma/prisma.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService, PrismaService],
})
export class LocationModule { }
