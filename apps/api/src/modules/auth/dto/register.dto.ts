import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  /**
   * Optional admin code used to create admin / municipality accounts.
   * Only requests providing the correct code (SUPER_ADMIN_CODE) will be allowed
   * to create elevated roles. Regular users should never set this.
   */
  @IsOptional()
  @IsString()
  adminCode?: string;
}
