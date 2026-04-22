import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const enableQueryLogs = process.env.PRISMA_LOG_QUERIES === 'true';

    super({
      log: enableQueryLogs
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

    const logger = this.logger;

    //SOLUCIÓN CON @ts-ignore
    if (enableQueryLogs) {
      // @ts-ignore
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // @ts-ignore
    this.$on('warn', (e: any) => {
      this.logger.warn(e.message);
    });

    // @ts-ignore
    this.$on('error', (e: any) => {
      this.logger.error(e.message);
    });

    this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const t0 = Date.now();
            const result = await query(args);
            if (enableQueryLogs) {
              logger.debug(`${model}.${operation} took ${Date.now() - t0}ms`);
            }
            return result;
          },
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

