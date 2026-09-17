import { Request, Response, NextFunction } from 'express';

export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    res.status(400).json({ error: 'Idempotency-Key header is required' });
    return;
  }
  
  req.body.idempotency_key = idempotencyKey;
  next();
}
