import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findByIdWithPin(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, pin: true, rol: true, activo: true },
    });
  }
}
