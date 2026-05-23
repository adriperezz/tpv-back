import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnularVentaDto, CobrarVentaDto, CorregirMetodoPagoDto } from './dto/ventas.dto';
import { VentasService } from './ventas.service';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private service: VentasService) {}

  @Post()
  @ApiOperation({ summary: 'Cobrar una venta (crea venta + líneas + tickets físicos)' })
  cobrar(@Body() dto: CobrarVentaDto, @Request() req: any) {
    return this.service.cobrar(dto, req.user.sub);
  }

  @Get('hoy')
  @ApiOperation({ summary: 'Ventas de hoy (todas las taquillas)' })
  findToday() {
    return this.service.findToday();
  }

  @Get('taquilla/:num')
  @ApiOperation({ summary: 'Ventas de una taquilla, opcionalmente filtradas por fecha YYYY-MM-DD' })
  @ApiQuery({ name: 'fecha', required: false })
  findByTaquilla(@Param('num', ParseIntPipe) num: number, @Query('fecha') fecha?: string) {
    return this.service.findByTaquilla(num, fecha);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una venta' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular venta (requiere PIN de admin)' })
  anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularVentaDto, @Request() req: any) {
    return this.service.anular(id, dto, req.user.sub);
  }

  @Patch(':id/metodo-pago')
  @ApiOperation({ summary: 'Corregir método de pago (requiere PIN de admin)' })
  corregirMetodoPago(@Param('id', ParseIntPipe) id: number, @Body() dto: CorregirMetodoPagoDto) {
    return this.service.corregirMetodoPago(id, dto);
  }
}
