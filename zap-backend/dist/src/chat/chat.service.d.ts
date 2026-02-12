import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { Message, MessageType } from './message.entity';
export declare class ChatService {
    private chatRepository;
    private messageRepository;
    constructor(chatRepository: Repository<Chat>, messageRepository: Repository<Message>);
    createChat(participantIds: string[], isGroup?: boolean, name?: string): Promise<Chat>;
    getUserChats(userId: string): Promise<Chat[]>;
    saveMessage(chatId: string, senderId: string, content: string, type?: MessageType, fileUrl?: string): Promise<Message>;
    getChatMessages(chatId: string): Promise<Message[]>;
}
