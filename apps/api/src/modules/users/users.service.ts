import { Injectable, NotFoundException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Hazard } from '../hazards/entities/hazard.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  /**
   * Helper method to strip password from User entity
   */
  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...result } = user;
    return result;
  }

  /**
   * Helper method to strip passwords from array of User entities
   */
  private excludePasswordFromArray(users: User[]): Omit<User, 'password'>[] {
    return users.map(user => this.excludePassword(user));
  }

  /**
   * Internal method to get full user entity (with password) for internal operations
   */
  private async findOneInternal(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.excludePassword(savedUser);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return this.excludePasswordFromArray(users);
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOneInternal(id);
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto, userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOneInternal(id);

    if (user.id !== userId) {
      throw new ForbiddenException('You can only update your own account');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    const user = await this.findOneInternal(userId);

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateProfileDto);
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findOneInternal(userId);

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersRepository.save(user);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOneInternal(userId);
    user.pushToken = pushToken;
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  async remove(id: string, userId: string): Promise<void> {
    const user = await this.findOneInternal(id);

    if (user.id !== userId) {
      throw new ForbiddenException('You can only delete your own account');
    }
  }

  async deleteUserData(userId: string, deleteDataDto: { email: string }): Promise<void> {
    const user = await this.findOneInternal(userId);

    // Verify email matches for security
    if (user.email !== deleteDataDto.email) {
      throw new UnauthorizedException('Email does not match your account email');
    }

    // Delete all hazards created by this user
    await this.hazardsRepository.delete({ userId: user.id });

    // Delete the user (notifications will be deleted by CASCADE)
    await this.usersRepository.remove(user);
  }

  async deleteUserDataByEmail(deleteDataDto: { email: string }): Promise<void> {
    const user = await this.findByEmail(deleteDataDto.email);
    
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }

    // Delete all hazards created by this user
    await this.hazardsRepository.delete({ userId: user.id });

    // Delete the user (notifications will be deleted by CASCADE)
    await this.usersRepository.remove(user);
  }
}
