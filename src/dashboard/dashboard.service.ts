import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async resumenDia(fecha?: string) {
    const { inicio, fin } = rangoFecha(fecha);

    const ventas = await this.prisma.venta.findMany({
      where: { timestamp: { gte: inicio, lte: fin } },
      include: { lineas: true, usuario: { select: { id: true, nombre: true } } },
    });

    const activas = ventas.filter((v) => v.estado === 'ACTIVA');
    const anuladas = ventas.filter((v) => v.estado === 'ANULADA');

    const totalEfectivo = sumLineasByMetodo(activas, 'EFECTIVO');
    const totalTarjeta = sumLineasByMetodo(activas, 'TARJETA');
    const totalTransferencia = sumLineasByMetodo(activas, 'TRANSFERENCIA');

    // Unidades vendidas por producto
    const productoMap: Record<number, { nombre: string; unidades: number; total: number }> = {};
    for (const v of activas) {
      for (const l of v.lineas) {
        if (!productoMap[l.productoId]) {
          productoMap[l.productoId] = { nombre: l.nombreSnapshot, unidades: 0, total: 0 };
        }
        productoMap[l.productoId].unidades += l.cantidad;
        productoMap[l.productoId].total += Number(l.subtotal);
      }
    }

    const tickets = await this.prisma.ticketFisico.findMany({
      where: { timestamp: { gte: inicio, lte: fin } },
      include: { tipoTicket: true },
    });

    const ticketMap: Record<string, { cantidad: number; color: string }> = {};
    for (const t of tickets) {
      if (!ticketMap[t.tipoTicket.nombre]) {
        ticketMap[t.tipoTicket.nombre] = { cantidad: 0, color: t.tipoTicket.color };
      }
      ticketMap[t.tipoTicket.nombre].cantidad++;
    }

    return {
      fecha: fecha ?? new Date().toISOString().slice(0, 10),
      totalVentasActivas: activas.length,
      totalVentasAnuladas: anuladas.length,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalGeneral: totalEfectivo + totalTarjeta + totalTransferencia,
      productoResumen: Object.values(productoMap),
      ticketResumen: ticketMap,
    };
  }

  async facturacionPorDias(diasAtras = 30) {
    const desde = new Date();
    desde.setDate(desde.getDate() - diasAtras);
    desde.setHours(0, 0, 0, 0);

    const ventas = await this.prisma.venta.findMany({
      where: { timestamp: { gte: desde }, estado: 'ACTIVA' },
      include: { lineas: true },
    });

    const porDia: Record<string, number> = {};
    for (const v of ventas) {
      const dia = v.timestamp.toISOString().slice(0, 10);
      const totalVenta = v.lineas.reduce((s, l) => s + Number(l.subtotal), 0);
      porDia[dia] = (porDia[dia] ?? 0) + totalVenta;
    }

    return Object.entries(porDia)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  logAcciones(limit = 100) {
    return this.prisma.logAccion.findMany({
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  ticketsGlobal() {
    return this.prisma.tipoTicket.findMany({
      select: {
        nombre: true,
        color: true,
        contadorSerie: true,
      },
    });
  }
}

function rangoFecha(fecha?: string) {
  const inicio = fecha ? new Date(`${fecha}T00:00:00`) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const fin = fecha ? new Date(`${fecha}T23:59:59`) : (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();
  return { inicio, fin };
}

function sumLineasByMetodo(ventas: any[], metodo: string): number {
  return ventas
    .filter((v) => v.metodoPago === metodo)
    .reduce((sum, v) => sum + v.lineas.reduce((s: number, l: any) => s + Number(l.subtotal), 0), 0);
}
