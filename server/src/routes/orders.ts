import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createOrder, getOrder, getOrderByOrderNumber, listOrders, updateOrderStatus } from '../services/orderService';
import { idempotency } from '../middleware/idempotency';

const router = Router();

const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email format'),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive()
  })).min(1, 'At least one item is required')
});

router.post('/', idempotency, async (req: Request, res: Response) => {
  try {
    const result = createOrderSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.errors });
      return;
    }

    const order = await createOrder({
      ...result.data,
      idempotency_key: req.body.idempotency_key
    });

    res.status(201).json(order);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('Insufficient stock') || message.includes('not found')) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await listOrders({ status, page, limit });

    res.json({
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = await getOrder(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.get('/number/:orderNumber', async (req: Request, res: Response) => {
  try {
    const order = await getOrderByOrderNumber(req.params.orderNumber);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const order = await updateOrderStatus(id, status);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('Invalid status transition')) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
});

export default router;
