import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findOneWithPassword(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const match = await compare(pass, user.password);
    if (!match) {
      throw new UnauthorizedException('The credentials not match');
    }

    const payload = this.buildPayload(user);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
        ignoreExpiration: true,
      });

      const user = await this.usersService.findOneWithPassword(payload.email);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      return {
        access_token: await this.jwtService.signAsync(this.buildPayload(user)),
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  // TODO: adaptar según el modelo User de cada proyecto
  private buildPayload(user: any) {
    return {
      sub: user.id,
      email: user.email,
      // permissions: user.role.functionalities.map((x) => x.functionality.name),
    };
  }
}

