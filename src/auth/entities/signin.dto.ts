import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SignInData {
  @IsEmail()
  @ApiProperty()
  email: string;
  @ApiProperty()
  password: string;
}
