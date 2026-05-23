import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.PRISMA_LOG_QUERIES === 'true'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ]
        : [
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ],
    });

    // @ts-ignore
    this.$on('warn', (e: any) => this.logger.warn(e.message));
    // @ts-ignore
    this.$on('error', (e: any) => this.logger.error(e.message));

    if (process.env.PRISMA_LOG_QUERIES === 'true') {
      // @ts-ignore
      this.$on('query', (e: any) => this.logger.debug(`${e.query} [${e.duration}ms]`));
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma conectado');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
