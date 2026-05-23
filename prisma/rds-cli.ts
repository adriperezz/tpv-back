/**
 * Genera o usa un token IAM de RDS y ejecuta comandos de prisma/seed.
 *
 * USO:
 *   Con credenciales AWS configuradas (auto):
 *     npx ts-node prisma/rds-cli.ts db push
 *     npx ts-node prisma/rds-cli.ts -- prisma/seed.ts
 *
 *   Con token manual (pégalo como variable de entorno):
 *     RDS_TOKEN="eyJ..." npx ts-node prisma/rds-cli.ts db push
 *     RDS_TOKEN="eyJ..." npx ts-node prisma/rds-cli.ts -- prisma/seed.ts
 */
import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';

const RDS_HOST = 'database-1-instance-1.czwycgg0a046.eu-north-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_USER = 'postgres';
const RDS_DB = 'postgres';
const RDS_REGION = 'eu-north-1';

function getToken(): string {
  if (process.env.RDS_TOKEN) {
    console.log('→ Usando token RDS_TOKEN del entorno');
    return process.env.RDS_TOKEN;
  }

  try {
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
    console.log('→ Token IAM generado automáticamente');
    return token;
  } catch (err) {
    console.error('✗ No se pudo generar el token IAM automáticamente.');
    console.error('  Genera el token manualmente y pásalo así:');
    console.error(`  RDS_TOKEN="<token>" npm run db:push\n`);
    process.exit(1);
  }
}

const token = getToken();
const encoded = encodeURIComponent(token);
const url = `postgresql://${RDS_USER}:${encoded}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require`;

const args = process.argv.slice(2);
let cmd: string;

if (args[0] === '--') {
  cmd = `ts-node -r tsconfig-paths/register ${args.slice(1).join(' ')}`;
} else {
  cmd = `npx prisma ${args.join(' ')}`;
}

console.log(`→ Ejecutando: ${cmd}\n`);

execSync(cmd, {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});
