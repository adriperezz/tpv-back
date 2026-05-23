import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AbrirSesionDto, CerrarSesionDto } from './dto/sesion.dto';

@Injectable()
export class SesionesCajaService {
  constructor(private prisma: PrismaService) {}

  async abrir(dto: AbrirSesionDto, usuarioId: number) {
    const abierta = await this.prisma.sesionCaja.findFirst({
      where: { taquilla: dto.taquilla, cierre: null },
    });
    if (abierta) throw new BadRequestException('Ya hay una sesión abierta en esta taquilla');

    return this.prisma.sesionCaja.create({
      data: { taquilla: dto.taquilla, usuarioId },
    });
  }

  async parteX(taquilla: number) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { taquilla, cierre: null },
      orderBy: { apertura: 'desc' },
    });

    const desde = sesion?.apertura ?? startOfToday();

    return this.buildResumen(desde, new Date(), taquilla);
  }

  async cerrar(taquilla: number, dto: CerrarSesionDto, usuarioId: number) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { taquilla, cierre: null },
      orderBy: { apertura: 'desc' },
    });
    if (!sesion) throw new NotFoundException('No hay sesión abierta en esta taquilla');

    const resumen = await this.buildResumen(sesion.apertura, new Date(), taquilla);

    const { realEfectivo = null, realTarjeta = null, realTransferencia = null } = dto;

    const descuadre = (real: number | null, teorico: number) =>
      real !== null ? +(real - teorico).toFixed(2) : null;

    const snapshot = {
      ...resumen,
      realEfectivo,
      realTarjeta,
      realTransferencia,
      descuadreEfectivo: descuadre(realEfectivo, resumen.totalEfectivo),
      descuadreTarjeta: descuadre(realTarjeta, resumen.totalTarjeta),
      descuadreTransferencia: descuadre(realTransferencia, resumen.totalTransferencia),
      cerradoPor: usuarioId,
    };

    return this.prisma.sesionCaja.update({
      where: { id: sesion.id },
      data: { cierre: new Date(), snapshot },
    });
  }

  findHistorial(taquilla?: number) {
    return this.prisma.sesionCaja.findMany({
      where: taquilla ? { taquilla } : undefined,
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { apertura: 'desc' },
    });
  }

  private async buildResumen(desde: Date, hasta: Date, taquilla?: number) {
    const where = {
      estado: 'ACTIVA' as const,
      timestamp: { gte: desde, lte: hasta },
      ...(taquilla ? { taquilla } : {}),
    };

    const ventas = await this.prisma.venta.findMany({
      where,
      include: { lineas: true },
    });

    const totalEfectivo = sumByMetodo(ventas, 'EFECTIVO');
    const totalTarjeta = sumByMetodo(ventas, 'TARJETA');
    const totalTransferencia = sumByMetodo(ventas, 'TRANSFERENCIA');
    const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

    // Unidades por producto
    const productoMap: Record<number, { nombre: string; cantidad: number; total: number }> = {};
    for (const v of ventas) {
      for (const l of v.lineas) {
        if (!productoMap[l.productoId]) {
          productoMap[l.productoId] = { nombre: l.nombreSnapshot, cantidad: 0, total: 0 };
        }
        productoMap[l.productoId].cantidad += l.cantidad;
        productoMap[l.productoId].total += Number(l.subtotal);
      }
    }

    // Tickets por tipo
    const tickets = await this.prisma.ticketFisico.findMany({
      where: {
        timestamp: { gte: desde, lte: hasta },
        ...(taquilla ? { taquilla } : {}),
      },
      include: { tipoTicket: true },
    });

    const tipoTicketMap: Record<string, number> = {};
    for (const t of tickets) {
      tipoTicketMap[t.tipoTicket.nombre] = (tipoTicketMap[t.tipoTicket.nombre] ?? 0) + 1;
    }

    return {
      desde,
      hasta,
      taquilla,
      totalVentas: ventas.length,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalGeneral,
      productoResumen: Object.values(productoMap),
      ticketResumen: tipoTicketMap,
    };
  }
}

function sumByMetodo(ventas: any[], metodo: string): number {
  return ventas
    .filter((v) => v.metodoPago === metodo)
    .reduce((sum, v) => sum + v.lineas.reduce((s: number, l: any) => s + Number(l.subtotal), 0), 0);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
