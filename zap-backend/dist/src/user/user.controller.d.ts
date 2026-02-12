import { UserService } from './user.service';
import { User } from './user.entity';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<User | null>;
    updateProfile(req: any, updateData: Partial<User>): Promise<User | null>;
}
