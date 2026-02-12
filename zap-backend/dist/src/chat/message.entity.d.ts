import { User } from '../user/user.entity';
import { Chat } from './chat.entity';
export declare enum MessageType {
    TEXT = "text",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
    CIRCLE = "circle"
}
export declare class Message {
    id: string;
    content: string;
    type: MessageType;
    fileUrl: string;
    sender: User;
    chat: Chat;
    createdAt: Date;
}
