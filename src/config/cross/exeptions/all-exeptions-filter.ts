import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLogEntry, ErrorResponse } from './interfaces/all-exeptions-filter.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    this.handleException(exception, host);
  }

  private handleException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    this.logError(exception, request);

    response.status(errorResponse.code).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const body = request.body ?? null;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as Record<string, unknown>;

      return {
        code: status,
        message: (res?.['message'] as string) ?? exception.message,
        payload: res?.['payload'] ?? null,
        body,           
        timestamp,
        path,
      };
    }

    const err = exception as Error;

    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message ?? 'Internal Server Error',
      payload: null,
      body,           
      timestamp,
      path,
    };
  }

  private logError(exception: unknown, request: Request): void {
    const errorEntry: ErrorLogEntry = {
      name: (exception as any)?.name ?? 'UnknownException',
      message: (exception as any)?.message ?? 'No message',
      url: request.url,
      // requestBody: request.body,
      stack: (exception as any)?.stack,
    };

    this.logger.error(errorEntry);
  }
}
