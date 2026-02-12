import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req, @Body() updateData: Partial<User>) {
    return this.userService.update(req.user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('q') query: string) {
    if (!query || query.length < 1) return [];
    const cleanQuery = query.startsWith('@') ? query.substring(1) : query;
    return this.userService.searchByLogin(cleanQuery);
  }
}
