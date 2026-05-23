import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(usuarioId: number, pin: string): Promise<{ access_token: string; usuario: { id: number; nombre: string; rol: string } }> {
    const user = await this.usersService.findByIdWithPin(usuarioId);

    if (!user || !user.activo) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const match = await compare(pin, user.pin);
    if (!match) {
      throw new UnauthorizedException('PIN incorrecto');
    }

    const payload = { sub: user.id, nombre: user.nombre, rol: user.rol };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol },
    };
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: true,
      });

      const user = await this.usersService.findByIdWithPin(payload.sub);
      if (!user || !user.activo) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      return {
        access_token: await this.jwtService.signAsync({
          sub: user.id,
          nombre: user.nombre,
          rol: user.rol,
        }),
      };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  // Valida un PIN de admin para operaciones que requieren doble confirmación
  async validarPinAdmin(usuarioId: number, pin: string): Promise<boolean> {
    const user = await this.usersService.findByIdWithPin(usuarioId);
    if (!user || user.rol !== 'ADMIN' || !user.activo) return false;
    return compare(pin, user.pin);
  }
}
