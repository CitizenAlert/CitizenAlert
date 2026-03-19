import { IsEmail } from 'class-validator';

export class DeleteDataDto {
  @IsEmail()
  email: string;
}
