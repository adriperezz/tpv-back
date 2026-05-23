import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/prisma.service';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [AuthModule],
  providers: [VentasService, PrismaService],
  controllers: [VentasController],
  exports: [VentasService],
})
export class VentasModule {}
