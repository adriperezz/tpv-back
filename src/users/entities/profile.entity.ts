import { ApiProperty } from '@nestjs/swagger';

export class Profile {
  @ApiProperty({
    description: 'ID del usuario',
    type: Number,
  })
  sub!: number;

  @ApiProperty({
    description: 'Nombre del usuario',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    type: String,
  })
  lastname!: string;

  @ApiProperty({
    description: 'Email del usuario',
    type: String,
  })
  email!: string;

  @ApiProperty({
    description: 'Permisos del usuario',
    type: [String],
  })
  permissions!: string[];

  @ApiProperty({
    description: 'Fecha de emisión del token',
    type: Number,
  })
  iat!: number;

  @ApiProperty({
    description: 'Fecha de expiración del token',
    type: Number,
  })
  exp!: number;
}

