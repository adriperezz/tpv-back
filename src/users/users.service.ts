import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // TODO: añadir tipo que devuelve
  async findOneWithPassword(email: string) {
    return await this.prisma.user.findUnique({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        // TODO: adaptar según el modelo de roles de cada proyecto
        // role: {
        //   select: {
        //     functionalities: {
        //       select: {
        //         functionality: {
        //           select: {
        //             name: true,
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
      },
      where: {
        email,
      },
    });
  }

  async signUpUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    roleId: number,
  ) {
    const passwordHash = await hash(password, 10);

    await this.prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: passwordHash,
        roleId,
      },
    });
  }
}

