import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SignInData } from './entities/signin.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuthExceptionResponses, ApiLoginResponses } from 'src/common/decorators/code-responses.decorator';

@ApiAuthExceptionResponses()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({ type: SignInData })
  @ApiOperation({ summary: 'Iniciar sesión del usuario' })
  @ApiLoginResponses()
  @ApiResponse({
    description: 'User logged succesfully',
    status: HttpStatus.CREATED
  })
  signIn(@Body() signInDto: SignInData) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refrescado exitosamente',
  })
  async refreshToken(@Request() req) {
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('No se proporcionó token');
    }
    return this.authService.refreshToken(token);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
