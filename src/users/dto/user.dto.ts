import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpUser {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @IsEmail()
  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;

  @ApiProperty()
  roleId!: number;
}

