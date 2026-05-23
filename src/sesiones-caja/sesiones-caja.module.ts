import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SesionesCajaController } from './sesiones-caja.controller';
import { SesionesCajaService } from './sesiones-caja.service';

@Module({
  providers: [SesionesCajaService, PrismaService],
  controllers: [SesionesCajaController],
})
export class SesionesCajaModule {}
