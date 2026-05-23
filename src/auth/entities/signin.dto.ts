import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  usuarioId!: number;

  @ApiProperty({ example: '1234', description: 'PIN de 4 a 6 dígitos' })
  @IsString()
  @Length(4, 6)
  pin!: string;
}
