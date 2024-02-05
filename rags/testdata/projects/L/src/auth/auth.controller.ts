import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
} from '@nestjs/common';
import { AuthGuard, SkipAuth } from './auth.guard';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {

    }
    @HttpCode(HttpStatus.OK)
    @SkipAuth()
    @Post('/login')
    async signIn(@Body() cred: Record<string, any>) {
        return await this.authService.signIn(cred.email, cred.password);
    }
    @UseGuards(AuthGuard)
    @Get('/profile')
    getProfile(@Request() req) {
        return req.user;
    }

}
