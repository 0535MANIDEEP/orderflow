import { pool, initDb, closeDb } from '../src/db';
import { createOrder, getOrder, updateOrderStatus } from '../src/services/orderService';

beforeAll(async () => {
  process.env.DB_NAME = 'orderflow_test';
  
  try {
    await pool.query('CREATE DATABASE orderflow_test');
  } catch (e) {
    // Database might already exist
  }
  
  await pool.query('DROP TABLE IF EXISTS order_items CASCADE');
  await pool.query('DROP TABLE IF EXISTS orders CASCADE');
  await pool.query('DROP TABLE IF EXISTS products CASCADE');
  
  await initDb();
  
  await pool.query(`
    INSERT INTO products (name, description, price, stock_quantity) VALUES
    ('Laptop', 'High-performance laptop', 999.99, 10),
    ('Mouse', 'Wireless mouse', 29.99, 50),
    ('Keyboard', 'Mechanical keyboard', 79.99, 30)
  `);
});

afterAll(async () => {
  await closeDb();
});

describe('Order Service', () => {
  describe('createOrder', () => {
    it('should create order with multiple items', async () => {
      const order = await createOrder({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        items: [
          { product_id: 1, quantity: 1 },
          { product_id: 2, quantity: 2 }
        ],
        idempotency_key: 'test-key-1'
      });

      expect(order).toHaveProperty('id');
      expect(order.order_number).toMatch(/^ORD-\d{8}-\d{4}$/);
      expect(order.status).toBe('created');
      expect(parseFloat(order.total_amount as any)).toBe(1059.97);
      expect(order.items).toHaveLength(2);
    });

    it('should decrement stock after order', async () => {
      const result = await pool.query('SELECT stock_quantity FROM products WHERE id = 1');
      expect(result.rows[0].stock_quantity).toBe(9);
    });

    it('should return same order for same idempotency key', async () => {
      const order1 = await createOrder({
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        items: [{ product_id: 3, quantity: 1 }],
        idempotency_key: 'test-key-2'
      });

      const order2 = await createOrder({
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        items: [{ product_id: 3, quantity: 1 }],
        idempotency_key: 'test-key-2'
      });

      expect(order1.id).toBe(order2.id);
    });

    it('should fail with insufficient stock', async () => {
      await expect(createOrder({
        customer_name: 'Test',
        customer_email: 'test@example.com',
        items: [{ product_id: 1, quantity: 100 }],
        idempotency_key: 'test-key-3'
      })).rejects.toThrow('Insufficient stock');
    });

    it('should fail with non-existent product', async () => {
      await expect(createOrder({
        customer_name: 'Test',
        customer_email: 'test@example.com',
        items: [{ product_id: 999, quantity: 1 }],
        idempotency_key: 'test-key-4'
      })).rejects.toThrow('not found');
    });
  });

  describe('updateOrderStatus', () => {
    it('should transition from created to paid', async () => {
      const order = await createOrder({
        customer_name: 'Status Test',
        customer_email: 'status@test.com',
        items: [{ product_id: 2, quantity: 1 }],
        idempotency_key: 'status-test-1'
      });

      const updated = await updateOrderStatus(order.id, 'paid');
      expect(updated?.status).toBe('paid');
    });

    it('should reject invalid transition', async () => {
      const order = await createOrder({
        customer_name: 'Invalid Test',
        customer_email: 'invalid@test.com',
        items: [{ product_id: 2, quantity: 1 }],
        idempotency_key: 'invalid-test-1'
      });

      await expect(updateOrderStatus(order.id, 'shipped')).rejects.toThrow('Invalid status transition');
    });

    it('should restore stock on cancellation', async () => {
      const beforeStock = await pool.query('SELECT stock_quantity FROM products WHERE id = 2');
      const stockBefore = beforeStock.rows[0].stock_quantity;

      const order = await createOrder({
        customer_name: 'Cancel Test',
        customer_email: 'cancel@test.com',
        items: [{ product_id: 2, quantity: 1 }],
        idempotency_key: 'cancel-test-1'
      });

      await updateOrderStatus(order.id, 'cancelled');

      const afterStock = await pool.query('SELECT stock_quantity FROM products WHERE id = 2');
      expect(afterStock.rows[0].stock_quantity).toBe(stockBefore);
    });
  });
});
