import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AbrirSesionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  taquilla!: number;
}

export class CerrarSesionDto {
  @ApiPropertyOptional({ description: 'Efectivo real contado en caja (€)' })
  @IsOptional()
  @IsNumber()
  realEfectivo?: number;

  @ApiPropertyOptional({ description: 'Importe real cobrado por tarjeta (€)' })
  @IsOptional()
  @IsNumber()
  realTarjeta?: number;

  @ApiPropertyOptional({ description: 'Importe real cobrado por transferencia (€)' })
  @IsOptional()
  @IsNumber()
  realTransferencia?: number;
}
