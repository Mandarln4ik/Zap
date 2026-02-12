import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: any): Promise<{
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
