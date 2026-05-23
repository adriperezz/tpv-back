import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos los usuarios activos (id, nombre, rol)' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.usersService.findAll();
  }
}
