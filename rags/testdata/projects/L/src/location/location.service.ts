import { Injectable } from '@nestjs/common';
import { Prisma, Location as LocationModel } from '@prisma/client';

import { PrismaService } from 'L/src/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private readonly Prisma: PrismaService) {
  }

  async location(
    locationWhereUniqueInput: Prisma.LocationWhereUniqueInput,
  ): Promise<LocationModel | null> {
    return this.Prisma.location.findUnique({
      where: locationWhereUniqueInput,
    });
  }

  async locations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.LocationWhereUniqueInput;
    where?: Prisma.LocationWhereInput;
    orderBy?: Prisma.LocationOrderByWithRelationInput;
  }): Promise<LocationModel[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.Prisma.location.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }
  async allLocations() {
    return await this.Prisma.location.findMany();
  }
  async createLocation(data: Prisma.LocationCreateInput): Promise<LocationModel> {
    return this.Prisma.location.create({
      data,
    });
  }

  async updateLocation(params: {
    where: Prisma.LocationWhereUniqueInput;
    data: Prisma.LocationUpdateInput;
  }): Promise<LocationModel> {
    const { data, where } = params;
    return this.Prisma.location.update({
      data,
      where,
    });
  }

  async deleteLocation(where: Prisma.LocationWhereUniqueInput): Promise<LocationModel> {
    return this.Prisma.location.delete({
      where,
    });
  }
  findOne(_id: string) {
    return this.Prisma.location.findUnique({ where: { id: _id } })
  }

  remove(id: string) {
    return `This action removes a #${id} image`;
  }
}
