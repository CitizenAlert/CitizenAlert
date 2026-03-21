import { Body, Controller, Get, Post, Request, UnauthorizedException, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateMairieDto } from './dto/create-mairie.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

interface ValidateAdminCodeDto {
  adminCode: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('create-mairie')
  async createMairie(@Body() createMairieDto: CreateMairieDto, @Request() req: any) {
    // Verify the user is an admin
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only super admins can create mairie accounts');
    }
    
    // Call the service with the server-side admin code
    return this.authService.createMairieAccount(createMairieDto);
  }

  @Post('validate-admin-code')
  async validateAdminCode(@Body() dto: ValidateAdminCodeDto) {
    const valid = await this.authService.validateAdminCode(dto.adminCode);
    console.log(`[AUTH] Admin code validation: ${valid ? 'SUCCESS' : 'FAILED'}`);
    return { valid };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('municipalities')
  async getMunicipalities() {
    return this.authService.getAllMunicipalities();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admins')
  async getAdmins() {
    return this.authService.getAllAdmins();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('system-stats')
  async getSystemStats() {
    return this.authService.getSystemStats();
  }

  @Post('create-super-admin')
  async createSuperAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.createSuperAdmin(registerDto);
  }
}
