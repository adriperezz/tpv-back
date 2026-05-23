import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';
import { CrearInvitacionDto, FirmarInvitacionDto } from './dto/invitacion.dto';

const INCLUDE_FULL = {
  solicitante: { select: { id: true, nombre: true } },
  beneficiario: { select: { id: true, nombre: true } },
  firmante: { select: { id: true, nombre: true } },
  tickets: { include: { tipoTicket: true } },
};

@Injectable()
export class InvitacionesService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async crear(dto: CrearInvitacionDto) {
    // Valida que solicitante y beneficiario son distintos admins activos
    const [sol, ben] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { id: dto.solicitanteId } }),
      this.prisma.usuario.findUnique({ where: { id: dto.beneficiarioId } }),
    ]);

    if (!sol || sol.rol !== 'ADMIN' || !sol.activo) throw new BadRequestException('Solicitante inválido');
    if (!ben || ben.rol !== 'ADMIN' || !ben.activo) throw new BadRequestException('Beneficiario inválido');
    if (dto.solicitanteId === dto.beneficiarioId) throw new BadRequestException('Solicitante y beneficiario deben ser distintos');

    return this.prisma.invitacion.create({
      data: {
        solicitanteId: dto.solicitanteId,
        beneficiarioId: dto.beneficiarioId,
        nCopas: dto.nCopas,
        comentario: dto.comentario,
      },
      include: INCLUDE_FULL,
    });
  }

  async firmar(invitacionId: number, dto: FirmarInvitacionDto) {
    const invitacion = await this.prisma.invitacion.findUnique({ where: { id: invitacionId } });
    if (!invitacion) throw new NotFoundException('Invitación no encontrada');
    if (invitacion.firmado) throw new BadRequestException('Esta invitación ya fue firmada');
    if (dto.firmanteId === invitacion.solicitanteId) throw new BadRequestException('El firmante no puede ser el mismo que el solicitante');

    const pinOk = await this.authService.validarPinAdmin(dto.firmanteId, dto.pinFirmante);
    if (!pinOk) throw new UnauthorizedException('PIN del firmante incorrecto');

    // Obtiene tipo COPA para los tickets
    const tipoCopa = await this.prisma.tipoTicket.findUnique({ where: { nombre: 'COPA' } });
    if (!tipoCopa) throw new NotFoundException('Tipo de ticket COPA no configurado');

    return this.prisma.$transaction(async (tx) => {
      // Firma la invitación
      const invitacionFirmada = await tx.invitacion.update({
        where: { id: invitacionId },
        data: { firmanteId: dto.firmanteId, firmado: true },
      });

      // Genera tickets físicos de copa
      const tickets: { tipoTicketId: number; numeroSerie: number; invitacionId: number; taquilla: number; esInvitacion: boolean }[] = [];

      for (let i = 0; i < invitacion.nCopas; i++) {
        const tipoActualizado = await tx.tipoTicket.update({
          where: { id: tipoCopa.id },
          data: { contadorSerie: { increment: 1 } },
        });

        tickets.push({
          tipoTicketId: tipoCopa.id,
          numeroSerie: tipoActualizado.contadorSerie,
          invitacionId,
          taquilla: dto.taquilla,
          esInvitacion: true,
        });
      }

      await tx.ticketFisico.createMany({ data: tickets });

      // Registra en log
      await tx.logAccion.create({
        data: {
          usuarioId: dto.firmanteId,
          accion: 'FIRMAR_INVITACION',
          entidad: 'Invitacion',
          entidadId: invitacionId,
          datoDespues: { firmado: true, firmanteId: dto.firmanteId },
        },
      });

      return tx.invitacion.findUnique({ where: { id: invitacionId }, include: INCLUDE_FULL });
    });
  }

  findAll() {
    return this.prisma.invitacion.findMany({
      include: INCLUDE_FULL,
      orderBy: { timestamp: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.invitacion.findUnique({ where: { id }, include: INCLUDE_FULL });
  }
}
