export interface ErrorResponse {
  code: number;
  message: string;
  payload: unknown | null;
  body: unknown | null;
  timestamp: string;
  path: string;
}

export interface ErrorLogEntry {
  name: string;
  message: string;
  url?: string;
  requestBody?: unknown;
  stack?: string;
}
