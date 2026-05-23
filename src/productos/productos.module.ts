import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

@Module({
  providers: [ProductosService, PrismaService],
  controllers: [ProductosController],
  exports: [ProductosService],
})
export class ProductosModule {}
