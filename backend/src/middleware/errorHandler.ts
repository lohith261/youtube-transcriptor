import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  console.error(`[${new Date().toISOString()}] ${code}: ${err.message}`);

  res.status(statusCode).json({
    error: err.message ?? 'An unexpected error occurred.',
    code,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found.', code: 'NOT_FOUND' });
}
