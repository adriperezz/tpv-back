import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

const INCLUDE_TICKETS = {
  productoTickets: {
    include: { tipoTicket: true },
  },
};

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  findAll(soloActivos = false) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: INCLUDE_TICKETS,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const p = await this.prisma.producto.findUnique({ where: { id }, include: INCLUDE_TICKETS });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  async create(dto: CreateProductoDto) {
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: { nombre: dto.nombre, precio: dto.precio },
      });

      await tx.productoTicket.createMany({
        data: dto.tickets.map((t) => ({
          productoId: producto.id,
          tipoTicketId: t.tipoTicketId,
          cantidad: t.cantidad,
        })),
      });

      return tx.producto.findUnique({ where: { id: producto.id }, include: INCLUDE_TICKETS });
    });
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.precio !== undefined && { precio: dto.precio }),
        },
      });

      if (dto.tickets !== undefined) {
        await tx.productoTicket.deleteMany({ where: { productoId: id } });
        await tx.productoTicket.createMany({
          data: dto.tickets.map((t) => ({
            productoId: id,
            tipoTicketId: t.tipoTicketId,
            cantidad: t.cantidad,
          })),
        });
      }

      return tx.producto.findUnique({ where: { id }, include: INCLUDE_TICKETS });
    });
  }

  async toggleActivo(id: number, activo: boolean) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: { activo } });
  }

  findTiposTicket() {
    return this.prisma.tipoTicket.findMany({ orderBy: { nombre: 'asc' } });
  }
}
