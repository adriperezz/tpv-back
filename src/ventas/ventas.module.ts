import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrinterModule } from 'src/printer/printer.module';
import { PrismaService } from 'src/prisma.service';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [AuthModule, PrinterModule],
  providers: [VentasService, PrismaService],
  controllers: [VentasController],
  exports: [VentasService],
})
export class VentasModule {}
