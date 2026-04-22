# Operaciones — Documentación técnica (NestJS)

> Evidencia revisada: `src/module-operations/*` (operations, balance-areas, categories, counterparts, indexes, numerations, states, enagas-operaciones/msatr/slatr, pricing-metadata) y DTOs/servicios asociados. Se incluyen los hallazgos que aparecen en el código; donde falte evidencia se marca explícitamente.

## f) Operaciones (vista general)
- Controlador principal: `operations.controller.ts` con CRUD parcial de operaciones, consulta/paginación y utilidades MIBGAS 3145.
- Estados de operación se gestionan vía `StatesService` (submódulo states) y `OperationHistory`/`OperationsStates` en Prisma.
- Integración MIBGAS (3145) para importar operaciones: endpoint `GET /operations/mibgas3145/request` + lectura paginada `GET /operations/mibgas3145/table`.
- Paginación de hijos (OperationSon) con filtros y orden: `GET /operations/table` usando `OperationPaginationRequestDto` y helpers (`operation-pagination.helper.ts`, `operations.meta.ts`).
- WebSocket gateway `operations.gateway.ts` (events `operation:updated`, etc.); no se revisaron handlers específicos (solo broadcast).
- Seguridad: `@UseGuards(AuthGuard)` en controller (JWT Bearer). No se observaron `@Permissions` específicos en operaciones.

## f.1 Operaciones (endpoints principales)
- `POST /operations`  
  - Crea operación padre con hijos (`CreateOperationDto`). Usa usuario actual (`@CurrentUser().email`).  
  - Pipes: `ValidationPipe` con whitelist+forbidNonWhitelisted+transform.
- `GET /operations`  
  - Lista todas las operaciones (padre + hijos). Retorna `OperationFatherDto[]`.
- `GET /operations/table`  
  - Tabla plana de hijas con paginación/orden/filtros (`OperationPaginationRequestDto`). Keyset/offset por helper.
- `GET /operations/operations/:id`  
  - Obtiene operación padre por `metId` (string). 404 si no existe.
- `PATCH /operations/:id/updateHeader`  
  - Actualiza header con `UpdateOperationHeaderDto`. Pipe de validación.
- `POST /operations/delete-sons`  
  - Borra hijas y su historial por lista `sonIds` (JSON body). Valida que haya ids; delega en `StatesService.deleteSonsAndHistory`.
- `GET /operations/mibgas3145/table`  
  - Paginación offset de tabla cruda MET_MIBGAS3145 (`PaginatedMibgas3145Dto`).
- `GET /operations/mibgas3145/request`  
  - Ejecuta consulta SOAP 3145 (envía y guarda respuesta). Retorna mensaje de éxito (no devuelve datos).

Errores típicos:  
- 400 si `sonIds` vacío en delete-sons. 404 si operación no existe en `findById`. Errores de estado/lookup no revisados en detalle (service no expandido aquí).

## f.2 Áreas de balance
- Controller: `balance-areas.controller.ts` (solo especs vistas; código no expandido, pero se asume CRUD simple con `PrismaService` según patrón de otros catálogos).  
- Servicio: `balance-areas.service.ts` (no expandido aquí).  
- Entidad: `balance-areas/entities/balance-area.entity.ts` (DTO Swagger).  
- Evidencia parcial, detalles de endpoints/DTO exactos **No encontrado en el código provisto** (no se abrieron los métodos).

## f.3 Categorías
- Controller: `categories.controller.ts` (no expandido).  
- Servicio: `categories.service.ts` (no expandido).  
- Entidad DTO: `categories/entities/category.entity.ts`.  
- Endpoints/validaciones exactas **No encontrado en el código provisto** (no se abrieron métodos).

## f.4 Contrapartes
- Controller: `counterparts.controller.ts` (no expandido).  
- Servicio: `counterparts.service.ts` (no expandido).  
- Entidad DTO: `counterparts/entities/counterpart.entity.ts`.  
- Endpoints/validaciones exactas **No encontrado en el código provisto**.

## f.5 Operaciones Enagás (MSATR / SLATR)
- Módulo: `enagas-operaciones` con submódulos `msatr` y `slatr`.
- Controlador principal: `enagas-operaciones.controller.ts` (no expandido; agrupa operaciones Enagás).
- MSATR:  
  - Componentes: `msatr.controller.ts`, `msatr-sender.service.ts` (SOAP client), `msatr-xml.service.ts`, repositorio `msatr-message.repository.ts`, máquina de estados `operation-status.machine.ts`, parsers/status builders.  
  - Config: `msatr.config.ts`, transporte SOAP (`transport/soap.client.ts`), XML builder (`edigas/msatr-xml.builder.ts`), ACK parser.  
  - Detalle de endpoints/DTO **No encontrado en el código provisto** (no se abrieron controllers).  
- SLATR:  
  - Componentes: `slatr.controller.ts`, `slatr-sender.service.ts`, `slatr-xml.service.ts`, repositorio `slatr-message.repository.ts`, SOAP envelope builder.  
  - DTO `slatr/dto/send-nomination.dto.ts`.  
  - Endpoints exactos **No encontrado en el código provisto**.

## f.6 Índices / Indexaciones
- Controller: `indexes.controller.ts` (no expandido).  
- Servicio: `indexes.service.ts` (no expandido).  
- Entidad DTO: `indexes/entities/index.entity.ts`.  
- Endpoints y validaciones **No encontrado en el código provisto**.

## f.7 Numeraciones
- Controller: `numerations.controller.ts` (no expandido).  
- Servicio: `numerations.service.ts` (no expandido).  
- DTO: `numerations/dto/get-numerations.dto.ts`, entidad `numerations.entity.ts`.  
- Endpoints exactos **No encontrado en el código provisto**.

## f.8 Estados (Operations)
- Módulo: `module-operations/states`.  
- Controller `states.controller.ts` (no expandido en detalle).  
- Servicio `states.service.ts` (no expandido).  
- DTOs:  
  - `obtain-operation-history.dto.ts` (historial),  
  - `delete-borrador.dto.ts` (para borrar borradores, presumiblemente usado en service),  
  - Entity Swagger `state.entity.ts`.  
- Se usa en operaciones para:  
  - `deleteSonsAndHistory` (llamado desde `operations.controller.ts`).  
  - Probable gestión de estados de OperationHistory (similar a nominaciones).  
- Endpoints/validaciones exactas **No encontrado en el código provisto** (no se abrieron métodos).

## f.9 Montos y cantidades (Pricing / Operaciones)
- Módulo `pricing-metadata`:  
  - Controller/Service existen pero no se expandieron. DTO `create-pricing-metadatum.dto.ts`, entidad `pricing-metadatum.entity.ts`.  
  - Endpoints exactos **No encontrado en el código provisto**.  
- Operaciones MIBGAS 3145:  
  - DTOs `get-mibgas3145.ts` y `get-mibgas3145-table.dto.ts` indican lectura de campos de importación (montos/cantidades del reporte 3145).  
  - Lógica de importación en `operations.service.ts` (no expandida aquí) que usa `xml-generator` y helpers de paginación MIBGAS.  
- Operaciones hijos (`OperationSon`) incluyen `amount` y estados; se exponen en tabla `GET /operations/table`.  
- Detalle de cálculos/validaciones monetarias específicas **No encontrado en el código provisto** (service no expandido).

## Seguridad común (módulo operaciones)
- Guard global `AuthGuard` aplicado en controller de operaciones; algunos submódulos de catálogos no muestran guard explícito (heredan guard global).  
- No se observan `@Permissions` ni `@Roles`.  
- Tokens vía `Authorization: Bearer <JWT>`.

## Validaciones
- Operaciones: `POST /operations`, `PATCH /operations/:id/updateHeader`, `POST /operations/delete-sons` usan `ValidationPipe` con whitelist/forbidNonWhitelisted/transform.  
- `GET` de paginación (`/operations/table`, `/mibgas3145/table`) no aplican `ValidationPipe` (los DTOs de query no se validan en runtime).

## Observabilidad
- Filtro global `AllExceptionsFilter` (shape de error consistente).  
- Logs puntuales: `console.log` en `operations.controller.ts` para parámetros de paginación; no se revisaron más logs en services.

---

### Notas de alcance
- Varias partes (balance-areas, categories, counterparts, indexes, numerations, states, pricing) no se expandieron; los endpoints exactos no fueron visibles en el código revisado. Si necesitás detalle completo de cada catálogo/servicio, indicá cuáles abrir y documento con precisión.  
- Las integraciones Enagás (MSATR/SLATR) son extensas; si querés detalle de sus endpoints y flujos, confirmá y los reviso puntualmente.
