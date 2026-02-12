import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Chat } from './chat.entity';
import { Message, MessageType } from './message.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createChat(participantIds: string[], isGroup = false, name?: string) {
    const chat = this.chatRepository.create({
      participants: participantIds.map((id) => ({ id } as User)),
      isGroup,
      name,
    });
    return this.chatRepository.save(chat);
  }

  async getUserChats(userId: string) {
    return this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect('chat.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('chat.id')
          .from(Chat, 'chat')
          .leftJoin('chat.participants', 'p')
          .where('p.id = :userId', { userId })
          .getQuery();
        return 'chat.id IN ' + subQuery;
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }

  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileUrl?: string,
  ) {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    const message = this.messageRepository.create({
      chat: { id: chatId } as Chat,
      sender: { id: senderId } as User,
      content,
      type,
      fileUrl,
    });
    return this.messageRepository.save(message);
  }

  async getChatMessages(chatId: string) {
    return this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
