import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CrearInvitacionDto {
  @ApiProperty({ example: 1, description: 'ID del admin solicitante' })
  @IsInt()
  solicitanteId!: number;

  @ApiProperty({ example: 2, description: 'ID del admin beneficiario' })
  @IsInt()
  beneficiarioId!: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  nCopas!: number;

  @ApiPropertyOptional({ example: 'Por servicios prestados' })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class FirmarInvitacionDto {
  @ApiProperty({ example: 3, description: 'ID del segundo admin que firma' })
  @IsInt()
  firmanteId!: number;

  @ApiProperty({ example: '3333' })
  @IsString()
  pinFirmante!: string;

  @ApiProperty({ example: 1, description: 'Número de taquilla desde la que se emite' })
  @IsInt()
  taquilla!: number;
}
