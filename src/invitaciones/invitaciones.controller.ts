import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Rol } from 'src/auth/roles/roles';
import { CrearInvitacionDto, FirmarInvitacionDto } from './dto/invitacion.dto';
import { InvitacionesService } from './invitaciones.service';

@ApiTags('invitaciones')
@Controller('invitaciones')
@Roles(Rol.ADMIN)
export class InvitacionesController {
  constructor(private service: InvitacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las invitaciones' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una invitación' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear solicitud de invitación (sin firmar)' })
  crear(@Body() dto: CrearInvitacionDto) {
    return this.service.crear(dto);
  }

  @Post(':id/firmar')
  @ApiOperation({ summary: 'Firmar invitación con PIN de segundo admin — genera tickets físicos' })
  firmar(@Param('id', ParseIntPipe) id: number, @Body() dto: FirmarInvitacionDto) {
    return this.service.firmar(id, dto);
  }
}
