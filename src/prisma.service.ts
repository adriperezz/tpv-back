import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as AWS from 'aws-sdk';

const RDS_HOST = 'database-1-instance-1.czwycgg0a046.eu-north-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_USER = 'postgres';
const RDS_DB = 'postgres';
const RDS_REGION = 'eu-north-1';

// Token IAM dura 15 min; lo renovamos cada 14 para no quedarnos sin margen
const TOKEN_TTL_MS = 14 * 60 * 1000;

function buildIamUrl(): string {
  AWS.config.update({
    region: RDS_REGION,
    ...(process.env.AWS_ACCESS_KEY_ID && {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    }),
  });
  const signer = new (AWS as any).RDS.Signer({
    region: RDS_REGION,
    hostname: RDS_HOST,
    port: RDS_PORT,
    username: RDS_USER,
  });
  const token: string = signer.getAuthToken({});
  const encoded = encodeURIComponent(token);
  return `postgresql://${RDS_USER}:${encoded}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require`;
}

function buildStaticUrl(): string {
  return process.env.DATABASE_URL!;
}

// Si DATABASE_URL está configurado con credenciales estáticas, úsalo directamente.
// Si USE_IAM_AUTH=true, genera el token IAM dinámicamente.
function shouldUseIam(): boolean {
  return process.env.USE_IAM_AUTH === 'true';
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private tokenRefreshTimer?: NodeJS.Timeout;

  constructor() {
    const url = shouldUseIam() ? buildIamUrl() : buildStaticUrl();

    super({
      datasources: { db: { url } },
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
    this.logger.log('Prisma conectado a la base de datos');

    if (shouldUseIam()) {
      this.scheduleTokenRefresh();
    }
  }

  async onModuleDestroy() {
    if (this.tokenRefreshTimer) clearInterval(this.tokenRefreshTimer);
    await this.$disconnect();
  }

  // Reconecta con un token IAM fresco antes de que expire el actual
  private scheduleTokenRefresh() {
    this.tokenRefreshTimer = setInterval(async () => {
      this.logger.log('Renovando token IAM de RDS...');
      try {
        const newUrl = buildIamUrl();
        // Prisma no permite cambiar la URL en caliente; hay que reconectar
        await this.$disconnect();
        // Reinicia la instancia interna con la nueva URL
        (this as any)._engineConfig.datasources = { db: { url: newUrl } };
        await this.$connect();
        this.logger.log('Token IAM renovado correctamente');
      } catch (err) {
        this.logger.error('Error renovando token IAM', err);
      }
    }, TOKEN_TTL_MS);
  }
}
