# NestJS + Prisma Template — Guía de Setup

## -- Mínimo a configurar para arrancar el proyecto --

### 1. Clonar y preparar el repo

```bash
git clone https://github.com/tu-usuario/nest-prisma-template my-new-project
cd my-new-project
npm install
```

---

### 2. Variables de entorno

Crea un `.env` en la raíz (nunca se sube al repo):

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/my_db"

# JWT
JWT_SECRET="cambia-esto-por-un-secreto-seguro"
JWT_EXPIRES_IN="1h"

# App (Cors apuntando a tu frontend)
PORT=8080
CORS_ORIGIN="http://localhost:5173"

# Prisma (opcional — activa logs de queries en dev)
PRISMA_LOG_QUERIES=false
```

---

### 3. Prisma — definir el schema

Abre `prisma/schema.prisma` y define tus modelos. El template tiene la base mínima:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

#### Lo mínimo que necesitas añadir para que Auth y Users funcionen:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String   @unique
  password  String
  roleId    Int
  role      Role     @relation(fields: [roleId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique
  users User[]
}
```

> ⚠️ Adapta según tu modelo de negocio. Si no necesitas roles, simplifica el `User`.

#### Generar y migrar:

```bash
# EN CASO DE REALIZARLO CON MIGRACIONES Y NO MANUALMENTE

npm run create_migration  # crea la migración sin aplicarla
npm run migrate           # aplica las migraciones
npm run generate_types    # genera el cliente de Prisma
```

---

### 4. Auth — adaptar el payload del JWT

En `src/auth/auth.service.ts`, localiza el método `buildPayload` y adáptalo a tu modelo de `User`:

```typescript
// TODO: adaptar según el modelo User de cada proyecto
private buildPayload(user: any) {
  return {
    sub: user.id,
    email: user.email,
    // Añade aquí los campos que quieras en el token:
    // name: user.firstName,
    // permissions: user.role.permissions.map(p => p.name),
  };
}
```

---

### 5. Permisos — definir el enum

En `src/auth/permissions/permission.enum.ts`, añade los permisos de tu proyecto:

```typescript
export enum Permission {
  ManageUsers_RW = 'MANAGE_USERS_RW', // ya incluido en el template
  // Añade los tuyos:
  // Read_RW = 'READ_RW',
  // Admin_RW = 'ADMIN_RW',
}
```

---

### 6. Users — adaptar el service

En `src/users/users.service.ts`, el `findOneWithPassword` tiene el `select` mínimo. Si tu modelo de `User` tiene roles o permisos, descomenta y adapta:

Esto en el caso de usar autenticación por usuario y contraseña.

```typescript
async findOneWithPassword(email: string) {
  return await this.prisma.user.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      // Descomenta y adapta si tienes roles:
      // role: {
      //   select: {
      //     permissions: { select: { name: true } }
      //   }
      // }
    },
    where: { email },
  });
}
```

---

### 7. Swagger — personalizar título

En `src/main.ts` y `src/generate-swagger.ts`, actualiza el título y descripción:

```typescript
const config = new DocumentBuilder()
  .setTitle('Mi API') // ← cambia esto
  .setDescription('Descripción de mi proyecto') // ← y esto
  .setVersion('1.0');
// ...
```

---

### 8. App Module — registrar tus módulos

En `src/app.module.ts`, a medida que vayas creando módulos de negocio, impórtalos aquí:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    // Añade tus módulos aquí:
    // ProductsModule,
    // OrdersModule,
  ],
  // ...
})
```

---

### 9. Crear un nuevo módulo

Usa el CLI de NestJS para generar la estructura base automáticamente:

```bash
npx nest generate module products
npx nest generate controller products
npx nest generate service products
```

Esto crea:

```
src/products/
├── products.module.ts
├── products.controller.ts
├── products.controller.spec.ts
├── products.service.ts
└── products.service.spec.ts
```

Si necesitas paginación, copia el patrón de `ColumnMetaMap` de `src/common/pagination/`.

---

### 10. Arrancar el proyecto

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start
```

Swagger disponible en: `http://localhost:8080/api`

---

## -- Reutilización aprovechable --

A partir de aquí, se va a explicar como aprovechar al máximo las diferentes partes del programa que tiene el código ya integrado.

### 11. Exceptions Filter -- `AllExceptionsFilter`

Ya está registrado globalmente en `app.module.ts`. No necesitas hacer nada para activarlo — captura cualquier error de la app y devuelve siempre esta estructura:

```json
{
  "code": 404,
  "message": "User not found",
  "payload": null,
  "body": { "email": "test@test.com" },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/users/profile"
}
```

#### Lanzar errores con payload personalizado

Si quieres incluir datos extra en el error, usa `HttpException` directamente:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

throw new HttpException(
  {
    message: 'Producto no encontrado',
    payload: { productId: 42 }, // datos extra opcionales
  },
  HttpStatus.NOT_FOUND,
);
```

#### Errores estándar sin payload

Para casos simples, usa las excepciones built-in de NestJS:

```typescript
throw new NotFoundException('User not found');
throw new UnauthorizedException('Token inválido');
throw new BadRequestException('Datos incorrectos');
throw new ForbiddenException('Sin permisos');
```

---

### 12. Decoradores — `src/common/decorators` y `src/auth/decorators`

#### `@Public()` — marcar un endpoint como público (sin JWT)

```typescript
@Public()
@Get('health')
getHealth() {
  return { status: 'OK' };
}
```

#### `@CurrentUser()` — obtener el usuario del token en el controller

```typescript
@Get('profile')
getProfile(@CurrentUser() user) {
  return user; // { sub, email, ... lo que pusiste en buildPayload }
}
```

#### `@Permissions()` — proteger un endpoint por permiso

```typescript
@Permissions(Permission.ManageUsers_RW)
@Post('signUp')
signUp(@Body() dto: SignUpUser) {
  return this.usersService.signUpUser(...);
}
```

#### `@ApiAuthExceptionResponses()` — documentar respuestas de error en Swagger

Añádelo a nivel de controller para que Swagger muestre automáticamente los posibles 401, 403 y 500:

```typescript
@ApiAuthExceptionResponses()
@Controller('products')
export class ProductsController {}
```

#### `@ApiLoginResponses()` — para el endpoint de login específicamente

```typescript
@ApiLoginResponses()
@Post('login')
signIn(@Body() dto: SignInData) {}
```

---

### 13. Helpers — `src/common/helpers`

#### Parsear query params

Los query params siempre llegan como `string` desde HTTP. Usa estos helpers en los services o controllers:

```typescript
import { toInt } from 'src/common/helpers/number-parsers';
import { toBoolean } from 'src/common/helpers/boolean.parsers';
import {
  parseArrayValue,
  parseStringArrayValue,
} from 'src/common/helpers/array.parsers';

// "?page=3" llega como string "3"
const page = toInt(query.page); // → 3 (number)

// "?active=true" llega como string "true"
const active = toBoolean(query.active); // → true (boolean)

// "?ids=1,2,3" o "?ids=[1,2,3]"
const ids = parseArrayValue(query.ids); // → [1, 2, 3] (number[])

// "?tags=a,b,c"
const tags = parseStringArrayValue(query.tags); // → ['a', 'b', 'c'] (string[])
```

#### Helpers de fechas

```typescript
import {
  getDateByFormat,
  buildIntervalIntersectionWhereGeneric,
} from 'src/common/helpers/date-parsers';

// Convertir a UTC inicio/fin del día
const start = getDateByFormat('2025-01-15', 'ISO-UTC-START'); // 2025-01-15T00:00:00.000Z
const end = getDateByFormat('2025-01-15', 'ISO-UTC-END'); // 2025-01-15T23:59:59.999Z

// Filtro de intersección de intervalos para Prisma
// Útil cuando tienes registros con fechaInicio/fechaFin y quieres los que se solapan con un rango
const where = {
  AND: buildIntervalIntersectionWhereGeneric(
    'startDate', // campo inicio en tu modelo Prisma
    'endDate', // campo fin en tu modelo Prisma
    '2025-01-01', // desde
    '2025-01-31', // hasta
  ),
};
```

---

### 14. Paginación — `src/common/pagination`

Soporta dos estrategias: **keyset** (scroll infinito, tablas grandes) y **offset** (paginación numérica clásica).

#### Paso 1 — Definir el `ColumnMetaMap` de tu modelo

Crea `src/products/pagination/product.column-meta.ts`:

```typescript
import { ColumnMetaMap } from 'src/common/pagination/pagination.helper';

export const PRODUCT_COLUMN_META: ColumnMetaMap = {
  id: {
    read: (row) => row.id,
    orderBy: (dir) => ({ id: dir }),
    keysetWhere: (op, v) => ({ id: { [op]: v } }),
    selectForCursor: { id: true },
    supportsKeyset: true,
  },
  createdAt: {
    read: (row) => row.createdAt,
    orderBy: (dir) => ({ createdAt: dir }),
    keysetWhere: (op, v) => ({ createdAt: { [op]: v } }),
    selectForCursor: { createdAt: true },
    supportsKeyset: true,
  },
  // Añade una entrada por cada columna por la que quieras ordenar o paginar
};
```

#### Paso 2 — Llamar a `paginateGeneric` en el service

```typescript
import { paginateGeneric } from 'src/common/pagination/pagination.helper';
import { parseAndNormalizeSort, ensurePrimaryKeySort } from 'src/common/sorting/sorting.helper';
import { PRODUCT_COLUMN_META } from './pagination/product.column-meta';

async getProductTable(query: {
  cursor?: string;
  direction?: 'next' | 'prev';
  pageSize?: number;
  sort?: any;
  name?: string;
}) {
  const sort = ensurePrimaryKeySort(
    parseAndNormalizeSort(query.sort, PRODUCT_COLUMN_META),
    ['id'], // PK siempre al final para estabilidad
  );

  const where: Record<string, any> = {};
  if (query.name) {
    where.name = { contains: query.name, mode: 'insensitive' };
  }

  return paginateGeneric({
    prisma: this.prisma,
    model: this.prisma.product,
    strategy: 'keyset',   // o 'offset'
    where,
    sort,
    columnMeta: PRODUCT_COLUMN_META,
    cursor: query.cursor,
    direction: query.direction ?? 'next',
    pageSize: query.pageSize ?? 20,
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });
}
```

#### Paso 3 — Exponer en el controller

```typescript
@Get('table')
getTable(
  @Query('cursor') cursor?: string,
  @Query('direction') direction?: 'next' | 'prev',
  @Query('pageSize') pageSize?: string,
  @Query('sort') sort?: string,
  @Query('name') name?: string,
) {
  return this.service.getProductTable({
    cursor,
    direction,
    pageSize: toInt(pageSize),
    sort,
    name,
  });
}
```

#### Respuesta que devuelve

```json
{
  "data": [...],
  "pagination": {
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "2025-01-15T10:30:00.000Z|42",
    "prevCursor": null,
    "pageSize": 20,
    "sort": [{ "column": "createdAt", "order": "desc" }, { "column": "id", "order": "asc" }]
  }
}
```

#### Navegar páginas desde el frontend

```
# Primera página
GET /products/table?pageSize=20&sort=createdAt:desc

# Siguiente página — pasa el nextCursor de la respuesta anterior
GET /products/table?pageSize=20&sort=createdAt:desc&cursor=2025-01-15T10:30:00.000Z|42&direction=next

# Con filtros y sort múltiple
GET /products/table?sort=name:asc,createdAt:desc&name=laptop
```

#### Usar offset en vez de keyset

Cuando necesitas saltar a una página concreta (ej: página 5):

```typescript
return paginateGeneric({
  ...opciones,
  strategy: 'offset',
  offset: 80, // página 5 con pageSize 20
  pageSize: 20,
});
```

---

### 15. Sorting — `src/common/sorting`

`parseAndNormalizeSort` acepta el parámetro `sort` en cualquier formato que mande el frontend:

```typescript
import {
  parseAndNormalizeSort,
  ensurePrimaryKeySort,
} from 'src/common/sorting/sorting.helper';

// Todos estos formatos son válidos:
parseAndNormalizeSort('createdAt:desc', meta);
parseAndNormalizeSort('name:asc,createdAt:desc', meta);
parseAndNormalizeSort('[{"column":"name","order":"asc"}]', meta);
parseAndNormalizeSort([{ column: 'name', order: 'asc' }], meta);
```

El helper valida automáticamente que las columnas existan en el `ColumnMetaMap`. Si el frontend manda una columna que no existe, la ignora silenciosamente.

`ensurePrimaryKeySort` garantiza que la PK siempre está al final del sort, obligatorio para que keyset sea estable:

```typescript
const sort = ensurePrimaryKeySort(
  parseAndNormalizeSort(query.sort, PRODUCT_COLUMN_META),
  ['id'],
);
// Si query.sort = 'name:asc', el resultado es:
// [{ column: 'name', order: 'asc' }, { column: 'id', order: 'asc' }]
```

