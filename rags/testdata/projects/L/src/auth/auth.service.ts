import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
const bcrypt = require('bcrypt');
const saltRounds = 10;

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async signIn(email, pass) {
        const user = await this.userService.findOne({ email: email });
        
        const verify: boolean = await this.userService.checkPass(user.hash, pass)
        if (verify == true) {
            const payload = { sub: user.id, username: user.firmName };
            return {
                access_token: await this.jwtService.sign(payload),
            };
        } else {
            return new UnauthorizedException();
        }
    }
}