import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';

export class AbrirSesionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  taquilla!: number;
}

export class BilleteMDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  denominacion!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  cantidad!: number;
}

export class CerrarSesionDto {
  @ApiPropertyOptional({ type: [BilleteMDto], description: 'Arqueo manual de efectivo' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BilleteMDto)
  arqueo?: BilleteMDto[];
}
