import { Controller, Post, Get, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { SkipAuth } from 'L/src/auth/auth.guard';
const bcrypt = require('bcrypt');
const saltRounds = 10;
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }
    @SkipAuth()
    @Get('/')
    findOne() {
        return "users!";
    }
    @SkipAuth()
    @Post('/createpass')
    createPass(@Body() body: any) {
        this.userService.createPass(body.plain)
    }

    @SkipAuth()
    @Post('/createuser')
    async createUser(@Body() body: any) {
        const hashed: string = await new Promise((resolve, reject) => {
            bcrypt.hash(body.plain, saltRounds, function (err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })
        const user = await this.userService.createUser({
            firmName: body.firmName,
            email: body.email,
            hash: hashed
        });
        console.log(user);
        return user.id;

    }
}

