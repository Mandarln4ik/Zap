import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    createChat(createChatDto: {
        participantIds: string[];
        isGroup?: boolean;
        name?: string;
    }): Promise<import("./chat.entity").Chat>;
    getUserChats(req: any): Promise<import("./chat.entity").Chat[]>;
    getChatMessages(id: string): Promise<import("./message.entity").Message[]>;
}
