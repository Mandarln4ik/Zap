import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from './message.entity';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinChat(chatId: string, client: Socket): void;
    handleMessage(data: {
        chatId: string;
        senderId: string;
        content: string;
        type?: MessageType;
        fileUrl?: string;
    }): Promise<import("./message.entity").Message>;
}
