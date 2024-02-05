import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from 'L/src/user/user.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'L/src/prisma/prisma.service';
import { UserModule } from 'L/src/user/user.module';
import { jwtConstants } from './constants';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UserModule,
    JwtModule.register({
      global: true,
      secret: 'apple-beta-secrety',
      signOptions: { expiresIn: '24h' },
    }),],
  controllers: [AuthController],
  providers: [AuthService, UserService, PrismaService, JwtService]
})
export class AuthModule { }
