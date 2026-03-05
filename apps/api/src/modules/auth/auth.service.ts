import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { CreateMairieDto } from './dto/create-mairie.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    const { role, adminCode, ...rest } = registerDto;

    // By default, everyone is a citizen
    let finalRole: UserRole = UserRole.CITIZEN;

    const requestedRole = role ?? UserRole.CITIZEN;

    if (requestedRole !== UserRole.CITIZEN) {
      const superAdminCode = this.configService.get<string>('SUPER_ADMIN_CODE');

      // For elevated roles (admin / municipality), require a valid SUPER_ADMIN_CODE
      if (!superAdminCode || !adminCode || adminCode !== superAdminCode) {
        throw new ForbiddenException('Invalid admin code for elevated role creation');
      }

      finalRole = requestedRole;
    }

    const user = await this.usersService.create({
      ...(rest as any),
      role: finalRole,
    });
    return this.login(user);
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async createMairieAccount(createMairieDto: CreateMairieDto): Promise<{ access_token: string; user: Partial<User> }> {
    // This method is only called by the /auth/create-mairie endpoint
    // which is protected by JwtAuthGuard and RolesGuard (admin only)
    // No need to verify SUPER_ADMIN_CODE since the endpoint is already protected
    
    // Create the mairie account directly
    const user = await this.usersService.create({
      ...createMairieDto,
      role: UserRole.MUNICIPALITY,
    });

    // Return the created user info (without logging them in)
    return {
      access_token: '', // Empty token since we don't want to log in as the new user
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
