import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MetodoPago } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';
import { AnularVentaDto, CobrarVentaDto, CorregirMetodoPagoDto } from './dto/ventas.dto';

@Injectable()
export class VentasService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async cobrar(dto: CobrarVentaDto, usuarioId: number) {
    if (dto.lineas.length === 0) throw new BadRequestException('El carrito está vacío');

    // Carga productos y valida existencia
    const productoIds = dto.lineas.map((l) => l.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds }, activo: true },
      include: { productoTickets: { include: { tipoTicket: true } } },
    });

    if (productos.length !== productoIds.length) {
      throw new NotFoundException('Uno o más productos no existen o están inactivos');
    }

    const productoMap = new Map(productos.map((p) => [p.id, p]));

    return this.prisma.$transaction(async (tx) => {
      // Crea la venta
      const venta = await tx.venta.create({
        data: { metodoPago: dto.metodoPago, taquilla: dto.taquilla, usuarioId },
      });

      let total = 0;

      // Crea líneas de venta
      for (const linea of dto.lineas) {
        const producto = productoMap.get(linea.productoId)!;
        const subtotal = Number(producto.precio) * linea.cantidad;
        total += subtotal;

        await tx.lineaVenta.create({
          data: {
            ventaId: venta.id,
            productoId: linea.productoId,
            nombreSnapshot: producto.nombre,
            cantidad: linea.cantidad,
            precioUnitario: producto.precio,
            subtotal,
          },
        });

        // Genera tickets físicos por tipo
        for (const pt of producto.productoTickets) {
          const totalTickets = pt.cantidad * linea.cantidad;

          for (let i = 0; i < totalTickets; i++) {
            // Incrementa el contador global atómicamente
            const tipoActualizado = await tx.tipoTicket.update({
              where: { id: pt.tipoTicketId },
              data: { contadorSerie: { increment: 1 } },
            });

            await tx.ticketFisico.create({
              data: {
                tipoTicketId: pt.tipoTicketId,
                numeroSerie: tipoActualizado.contadorSerie,
                ventaId: venta.id,
                taquilla: dto.taquilla,
              },
            });
          }
        }
      }

      // Retorna venta completa con tickets
      return tx.venta.findUnique({
        where: { id: venta.id },
        include: {
          lineas: true,
          tickets: { include: { tipoTicket: true } },
          usuario: { select: { id: true, nombre: true } },
        },
      });
    });
  }

  async anular(ventaId: number, dto: AnularVentaDto, usuarioId: number) {
    const venta = await this.prisma.venta.findUnique({ where: { id: ventaId } });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    if (venta.estado === 'ANULADA') throw new BadRequestException('La venta ya está anulada');

    const pinOk = await this.authService.validarPinAdmin(dto.adminId, dto.pinAdmin);
    if (!pinOk) throw new UnauthorizedException('PIN de admin incorrecto');

    return this.prisma.$transaction(async (tx) => {
      const antes = { ...venta };

      await tx.venta.update({ where: { id: ventaId }, data: { estado: 'ANULADA' } });

      await tx.logAccion.create({
        data: {
          usuarioId: dto.adminId,
          accion: 'ANULAR_VENTA',
          entidad: 'Venta',
          entidadId: ventaId,
          ventaId,
          datoAntes: antes,
          datoDespues: { ...antes, estado: 'ANULADA' },
        },
      });

      return { ok: true };
    });
  }

  async corregirMetodoPago(ventaId: number, dto: CorregirMetodoPagoDto) {
    const venta = await this.prisma.venta.findUnique({ where: { id: ventaId } });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    if (venta.estado === 'ANULADA') throw new BadRequestException('No se puede editar una venta anulada');

    const pinOk = await this.authService.validarPinAdmin(dto.adminId, dto.pinAdmin);
    if (!pinOk) throw new UnauthorizedException('PIN de admin incorrecto');

    return this.prisma.$transaction(async (tx) => {
      await tx.venta.update({ where: { id: ventaId }, data: { metodoPago: dto.nuevoMetodoPago } });

      await tx.logAccion.create({
        data: {
          usuarioId: dto.adminId,
          accion: 'CORREGIR_METODO_PAGO',
          entidad: 'Venta',
          entidadId: ventaId,
          ventaId,
          datoAntes: { metodoPago: venta.metodoPago },
          datoDespues: { metodoPago: dto.nuevoMetodoPago },
        },
      });

      return { ok: true };
    });
  }

  findOne(id: number) {
    return this.prisma.venta.findUnique({
      where: { id },
      include: {
        lineas: true,
        tickets: { include: { tipoTicket: true } },
        usuario: { select: { id: true, nombre: true } },
      },
    });
  }

  findByTaquilla(taquilla: number, fecha?: string) {
    const inicio = fecha ? new Date(`${fecha}T00:00:00`) : startOfToday();
    const fin = fecha ? new Date(`${fecha}T23:59:59`) : endOfToday();

    return this.prisma.venta.findMany({
      where: { taquilla, timestamp: { gte: inicio, lte: fin } },
      include: { lineas: true, usuario: { select: { id: true, nombre: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }

  findToday() {
    return this.prisma.venta.findMany({
      where: { timestamp: { gte: startOfToday() } },
      include: { lineas: true, usuario: { select: { id: true, nombre: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
