import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbrirSesionDto, CerrarSesionDto } from './dto/sesion.dto';
import { SesionesCajaService } from './sesiones-caja.service';

@ApiTags('sesiones-caja')
@Controller('sesiones-caja')
export class SesionesCajaController {
  constructor(private service: SesionesCajaService) {}

  @Post('abrir')
  @ApiOperation({ summary: 'Abrir sesión de caja en una taquilla' })
  abrir(@Body() dto: AbrirSesionDto, @Request() req: any) {
    return this.service.abrir(dto, req.user.sub);
  }

  @Get('parte-x/:taquilla')
  @ApiOperation({ summary: 'Parte X: consulta sin cerrar (ventas de la sesión activa)' })
  parteX(@Param('taquilla', ParseIntPipe) taquilla: number) {
    return this.service.parteX(taquilla);
  }

  @Post('cerrar/:taquilla')
  @ApiOperation({ summary: 'Parte Z: cierre de caja con snapshot + arqueo opcional' })
  cerrar(
    @Param('taquilla', ParseIntPipe) taquilla: number,
    @Body() dto: CerrarSesionDto,
    @Request() req: any,
  ) {
    return this.service.cerrar(taquilla, dto, req.user.sub);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Historial de cierres de caja' })
  @ApiQuery({ name: 'taquilla', required: false, type: Number })
  historial(@Query('taquilla') taquilla?: string) {
    return this.service.findHistorial(taquilla ? Number(taquilla) : undefined);
  }
}
