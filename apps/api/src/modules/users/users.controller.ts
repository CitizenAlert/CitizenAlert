import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteDataDto } from './dto/delete-data.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private loadTemplate(filename: string): string {
    const distPath = join(__dirname,  '..',  '..', 'templates', filename);
    const srcPath = join(__dirname, '..', '..', 'templates', filename);
    
    try {
      // Try from dist directory (production)
      return readFileSync(distPath, 'utf-8');
    } catch (err) {
      try {
        // Fallback to src directory (development)
        return readFileSync(srcPath, 'utf-8');
      } catch (err2) {
        throw new Error(`Template ${filename} not found at ${distPath}`);
      }
    }
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.update(id, updateUserDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req: any) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  registerPushToken(@Body('pushToken') pushToken: string, @Request() req: any) {
    return this.usersService.updatePushToken(req.user.userId, pushToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deleteAccount(@Request() req: any) {
    return this.usersService.remove(req.user.userId, req.user.userId);
  }

  @Get('delete-data-page')
  getDeleteDataPage(@Res() res: Response) {
    const htmlContent = this.loadTemplate('delete-data.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  }

  @Post('delete-data')
  deleteData(@Body() deleteDataDto: DeleteDataDto) {
    return this.usersService.deleteUserDataByEmail(deleteDataDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.userId);
  }
}
