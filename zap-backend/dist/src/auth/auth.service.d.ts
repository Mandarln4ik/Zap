import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(login: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            login: any;
            username: any;
            avatar: any;
        };
    }>;
    register(userData: Partial<User>): Promise<{
        access_token: string;
        user: {
            id: any;
            login: any;
            username: any;
            avatar: any;
        };
    }>;
}
