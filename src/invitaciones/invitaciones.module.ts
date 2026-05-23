import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/prisma.service';
import { InvitacionesController } from './invitaciones.controller';
import { InvitacionesService } from './invitaciones.service';

@Module({
  imports: [AuthModule],
  providers: [InvitacionesService, PrismaService],
  controllers: [InvitacionesController],
})
export class InvitacionesModule {}
