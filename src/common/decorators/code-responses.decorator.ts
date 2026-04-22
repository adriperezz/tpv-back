import { applyDecorators } from "@nestjs/common";
import { ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse } from "@nestjs/swagger";

/**
 * Decorador que agrega respuestas estándar de autenticación/autorización a un endpoint protegido.
 *
 * - 401 Unauthorized: El usuario no está autenticado o el token es inválido.
 * - 403 Forbidden: El usuario autenticado no tiene permisos suficientes para acceder al recurso solicitado.
 * - 500 Internal Server Error: Ocurrió un error inesperado en el servidor durante el procesamiento de la solicitud.
 *
 * Útil para asegurar que la documentación Swagger muestre correctamente los posibles códigos de error en endpoints que requieren autenticación.
 *
 * @returns Un decorador combinado que aplica las respuestas estándar relacionadas con auth.
 */
export function ApiAuthExceptionResponses() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'No autenticado: Token JWT faltante, inválido o expirado.'
    }),
    ApiForbiddenResponse({
      description: 'Prohibido: El usuario autenticado no tiene permisos suficientes para esta operación.'
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.'
    })
  );
}

/**
 * Decorador que aplica respuestas estándar esperadas para el endpoint de login.
 *
 * Incluye las siguientes posibles respuestas HTTP:
 * - 500 Internal Server Error: Ocurrió un error inesperado en el servidor.
 * - 404 Not Found: El recurso solicitado no fue encontrado (por ejemplo, usuario no existe).
 * - 401 Unauthorized: Credenciales proporcionadas inválidas o no autenticado.
 *
 * @returns Un decorador que agrega estas respuestas al endpoint correspondiente en Swagger.
 */
export function ApiLoginResponses() {
  return applyDecorators(
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.'
    }),
    ApiForbiddenResponse({
      description: 'Prohibido: El usuario autenticado no tiene permisos suficientes para esta operación.'
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado: Token JWT faltante, inválido o expirado.'
    }),
    ApiNotFoundResponse({
      description: 'Usuario no encontrado'
    })
  );
}