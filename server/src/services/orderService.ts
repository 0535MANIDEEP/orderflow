import { pool } from '../db';
import { Order, OrderWithItems, OrderItem } from '../types';

interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  items: { product_id: number; quantity: number }[];
  idempotency_key: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const existingOrder = await client.query(
      'SELECT id FROM orders WHERE idempotency_key = $1',
      [input.idempotency_key]
    );

    if (existingOrder.rows.length > 0) {
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE idempotency_key = $1',
        [input.idempotency_key]
      );
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [existingOrder.rows[0].id]
      );
      
      await client.query('COMMIT');
      
      return {
        ...orderResult.rows[0],
        items: itemsResult.rows
      };
    }

    const productIds = input.items.map(item => item.product_id);
    const productsResult = await client.query(
      'SELECT * FROM products WHERE id = ANY($1) AND is_active = true FOR UPDATE',
      [productIds]
    );

    const productsMap = new Map(productsResult.rows.map(p => [p.id, p]));

    for (const item of input.items) {
      const product = productsMap.get(item.product_id);
      
      if (!product) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
    }

    let totalAmount = 0;
    for (const item of input.items) {
      const product = productsMap.get(item.product_id)!;
      totalAmount += product.price * item.quantity;
      
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    const orderCount = await client.query('SELECT COUNT(*) FROM orders');
    const count = parseInt(orderCount.rows[0].count) + 1;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${count.toString().padStart(4, '0')}`;

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, status, total_amount, customer_name, customer_email, idempotency_key)
       VALUES ($1, 'created', $2, $3, $4, $5) RETURNING *`,
      [orderNumber, totalAmount, input.customer_name, input.customer_email, input.idempotency_key]
    );

    const order = orderResult.rows[0];

    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      const product = productsMap.get(item.product_id)!;
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [order.id, item.product_id, item.quantity, product.price]
      );
      orderItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

    return {
      ...order,
      items: orderItems
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: number): Promise<OrderWithItems | null> {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  
  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows
  };
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const orderResult = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
  
  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderResult.rows[0].id]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows
  };
}

export async function listOrders(params: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: OrderWithItems[]; total: number }> {
  const { status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const queryParams: any[] = [];

  if (status) {
    query += ` AND status = $${queryParams.length + 1}`;
    queryParams.push(status);
  }

  const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), queryParams);
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);

  const ordersResult = await pool.query(query, queryParams);

  const ordersWithItems: OrderWithItems[] = [];
  for (const order of ordersResult.rows) {
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    ordersWithItems.push({
      ...order,
      items: itemsResult.rows
    });
  }

  return { data: ordersWithItems, total };
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: string
): Promise<Order | null> {
  const validTransitions: Record<string, string[]> = {
    created: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  
  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];
  const allowedTransitions = validTransitions[order.status] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
  }

  if (newStatus === 'cancelled') {
    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    
    for (const item of items.rows) {
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
  }

  const result = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStatus, orderId]
  );

  return result.rows[0];
}
