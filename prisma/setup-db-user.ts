/**
 * Script de setup ONE-TIME:
 * Conecta con token IAM y crea un usuario postgres con contraseña fija.
 * Después ya no necesitas tokens IAM — usa DATABASE_URL con esa contraseña.
 *
 * Uso:
 *   RDS_TOKEN="<token del botón Get token>" APP_DB_PASSWORD="una_password_segura" \
 *     ts-node -r tsconfig-paths/register prisma/setup-db-user.ts
 */
import { Client } from 'pg';

const HOST = 'database-1-instance-1.czwycgg0a046.eu-north-1.rds.amazonaws.com';
const PORT = 5432;
const DB = 'postgres';
const APP_USER = 'tpv_app';

async function main() {
  const token = process.env.RDS_TOKEN;
  const appPassword = process.env.APP_DB_PASSWORD;

  if (!token) {
    console.error('✗ Falta RDS_TOKEN. Obtén el token en la consola AWS → "Get token"');
    process.exit(1);
  }
  if (!appPassword) {
    console.error('✗ Falta APP_DB_PASSWORD. Pon la contraseña que quieras usar, ej:');
    console.error('  APP_DB_PASSWORD="corpus2025!" RDS_TOKEN="..." ts-node prisma/setup-db-user.ts');
    process.exit(1);
  }

  const client = new Client({
    host: HOST,
    port: PORT,
    database: DB,
    user: 'postgres',
    password: token,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Conectado a RDS');

    // Crea el usuario si no existe
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
          CREATE USER ${APP_USER} WITH PASSWORD '${appPassword.replace(/'/g, "''")}';
        ELSE
          ALTER USER ${APP_USER} WITH PASSWORD '${appPassword.replace(/'/g, "''")}';
        END IF;
      END
      $$;
    `);
    console.log(`✓ Usuario "${APP_USER}" creado/actualizado`);

    // Permisos sobre schema public
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB} TO ${APP_USER};`);
    await client.query(`GRANT ALL ON SCHEMA public TO ${APP_USER};`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};`);
    console.log('✓ Permisos concedidos');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Copia esto en tu .env:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`USE_IAM_AUTH=false`);
    console.log(`DATABASE_URL="postgresql://${APP_USER}:${appPassword}@${HOST}:${PORT}/${DB}?sslmode=require"`);
    console.log('═══════════════════════════════════════════════════════\n');

  } finally {
    await client.end();
  }
}

main().catch(console.error);
