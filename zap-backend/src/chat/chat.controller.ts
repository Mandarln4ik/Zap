import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  createChat(@Body() createChatDto: { participantIds: string[]; isGroup?: boolean; name?: string }) {
    return this.chatService.createChat(
      createChatDto.participantIds,
      createChatDto.isGroup,
      createChatDto.name,
    );
  }

  @Get()
  getUserChats(@Request() req) {
    return this.chatService.getUserChats(req.user.userId);
  }

  @Get(':id/messages')
  getChatMessages(@Param('id') id: string) {
    return this.chatService.getChatMessages(id);
  }

  @Post('private/:targetUserId')
  findOrCreatePrivateChat(@Request() req, @Param('targetUserId') targetUserId: string) {
    return this.chatService.findOrCreatePrivateChat(req.user.userId, targetUserId);
  }
}
