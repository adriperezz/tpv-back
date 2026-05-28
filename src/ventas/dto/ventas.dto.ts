import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class LineaCarritoDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  productoId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CobrarVentaDto {
  @ApiProperty({ enum: MetodoPago })
  @IsEnum(MetodoPago)
  metodoPago!: MetodoPago;

  @ApiProperty({ example: 1, description: 'Número de taquilla física' })
  @IsInt()
  @Min(1)
  taquilla!: number;

  @ApiProperty({ type: [LineaCarritoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaCarritoDto)
  lineas!: LineaCarritoDto[];

  @ApiPropertyOptional({ example: 20.0, description: 'Efectivo entregado (solo para método EFECTIVO)' })
  @IsOptional()
  @IsNumber()
  efectivoEntregado?: number;

  @ApiPropertyOptional({ example: '192.168.1.101', description: 'IP de la impresora ESC/POS (puerto 9100)' })
  @IsOptional()
  @IsString()
  impresoraIp?: string;

  @ApiPropertyOptional({ example: 'Viernes 6 Junio 2026', description: 'Fecha del evento para el ticket impreso' })
  @IsOptional()
  @IsString()
  fechaEvento?: string;
}

export class AnularVentaDto {
  @ApiProperty({ example: 1, description: 'ID del admin que autoriza' })
  @IsInt()
  adminId!: number;

  @ApiProperty({ example: '1234' })
  @IsString()
  pinAdmin!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class CorregirMetodoPagoDto {
  @ApiProperty({ enum: MetodoPago })
  @IsEnum(MetodoPago)
  nuevoMetodoPago!: MetodoPago;

  @ApiProperty({ example: 1 })
  @IsInt()
  adminId!: number;

  @ApiProperty({ example: '1234' })
  @IsString()
  pinAdmin!: string;
}
