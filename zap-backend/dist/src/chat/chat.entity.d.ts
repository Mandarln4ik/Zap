import { User } from '../user/user.entity';
import { Message } from './message.entity';
export declare class Chat {
    id: string;
    name: string;
    isGroup: boolean;
    participants: User[];
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}
