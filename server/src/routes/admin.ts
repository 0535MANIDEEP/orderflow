import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'created') as pending_orders,
        (SELECT COUNT(*) FROM products WHERE stock_quantity < 10 AND is_active = true) as low_stock_products
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';

    let query = `
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'product_name', p.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;

    const params: any[] = [];

    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }

    query += ` GROUP BY o.id ORDER BY o.${sortBy === 'total_amount' ? 'total_amount' : 'created_at'} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true';
    const lowStock = req.query.lowStock === 'true';

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    if (lowStock) {
      query += ' AND stock_quantity < 10';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.put('/products/:id/stock', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity, mode } = req.body;

    if (quantity === undefined || !mode) {
      res.status(400).json({ error: 'Quantity and mode are required' });
      return;
    }

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let query: string;
    if (mode === 'increment') {
      query = 'UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    } else {
      query = 'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    }

    const result = await pool.query(query, [quantity, id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

router.get('/revenue', async (_req: Request, res: Response) => {
  try {
    const dailyRevenue = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE status != 'cancelled' 
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const topProducts = await pool.query(`
      SELECT 
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    const avgOrderValue = await pool.query(`
      SELECT AVG(total_amount) as avg_value
      FROM orders 
      WHERE status != 'cancelled'
    `);

    res.json({
      dailyRevenue: dailyRevenue.rows,
      topProducts: topProducts.rows,
      averageOrderValue: parseFloat(avgOrderValue.rows[0].avg_value) || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

export default router;
