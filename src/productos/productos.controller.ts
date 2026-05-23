import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Rol } from 'src/auth/roles/roles';
import { CreateProductoDto, ToggleActivoDto, UpdateProductoDto } from './dto/producto.dto';
import { ProductosService } from './productos.service';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private service: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista productos (todos o solo activos)' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.service.findAll(soloActivos === 'true');
  }

  @Get('tipos-ticket')
  @ApiOperation({ summary: 'Lista tipos de ticket disponibles' })
  findTiposTicket() {
    return this.service.findTiposTicket();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un producto por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Crear producto (ADMIN)' })
  create(@Body() dto: CreateProductoDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto (ADMIN)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductoDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/activo')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Activar/desactivar producto (ADMIN)' })
  toggleActivo(@Param('id', ParseIntPipe) id: number, @Body() dto: ToggleActivoDto) {
    return this.service.toggleActivo(id, dto.activo);
  }
}
