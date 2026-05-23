import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './entities/signin.dto';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: SignInDto })
  @ApiOperation({ summary: 'Login con ID de usuario y PIN' })
  @ApiResponse({ status: 200, description: 'Token JWT + datos del usuario' })
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.usuarioId, dto.pin);
  }

  @Public()
  @Get('usuarios')
  @ApiOperation({ summary: 'Lista de usuarios activos para la pantalla de login' })
  @ApiResponse({ status: 200, description: 'Array de {id, nombre, rol}' })
  getUsuarios() {
    return this.usersService.findAll();
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  refreshToken(@Request() req: any) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();
    return this.authService.refreshToken(token);
  }

  @Post('validar-pin-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida PIN de un admin para operaciones protegidas' })
  @ApiBody({ schema: { properties: { usuarioId: { type: 'number' }, pin: { type: 'string' } } } })
  async validarPinAdmin(@Body() body: { usuarioId: number; pin: string }) {
    const ok = await this.authService.validarPinAdmin(body.usuarioId, body.pin);
    if (!ok) throw new UnauthorizedException('PIN de admin incorrecto');
    return { ok: true };
  }
}
