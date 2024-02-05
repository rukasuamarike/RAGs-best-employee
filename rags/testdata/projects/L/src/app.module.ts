import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromptsModule } from './prompts/prompts.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { ImagesModule } from './images/images.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PromptModule } from './prompt/prompt.module';
import { LocationModule } from './location/location.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SetMetadata } from '@nestjs/common';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }), // Load the .env file
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    PromptsModule, ImagesModule, UserModule, PrismaModule, PromptModule, LocationModule],//,AuthModule],
  controllers: [AppController],
  providers: [
  //   {
  //   provide: APP_GUARD,
  //   useClass: AuthGuard,
  // },JwtService, 
  //Uncomment this to default to unauthorized
  AppService, UserService],
})
export class AppModule { }
