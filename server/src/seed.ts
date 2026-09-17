import { pool, initDb } from './db';

const products = [
  { name: 'Laptop', description: 'High-performance laptop with 16GB RAM', price: 999.99, stock_quantity: 10 },
  { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, stock_quantity: 50 },
  { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 79.99, stock_quantity: 30 },
  { name: 'Monitor 27"', description: '4K IPS monitor', price: 349.99, stock_quantity: 15 },
  { name: 'USB-C Hub', description: '7-in-1 USB-C hub', price: 49.99, stock_quantity: 25 },
  { name: 'Webcam HD', description: '1080p HD webcam', price: 69.99, stock_quantity: 20 },
  { name: 'Headphones', description: 'Noise-cancelling headphones', price: 199.99, stock_quantity: 12 },
  { name: 'Desk Lamp', description: 'LED desk lamp with dimmer', price: 39.99, stock_quantity: 40 },
  { name: 'Notebook', description: 'Premium leather notebook', price: 24.99, stock_quantity: 100 },
  { name: 'Pen Set', description: 'Executive pen set', price: 34.99, stock_quantity: 60 }
];

async function seed() {
  await initDb();
  
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM products');

  for (const product of products) {
    await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity) VALUES ($1, $2, $3, $4)',
      [product.name, product.description, product.price, product.stock_quantity]
    );
  }

  console.log('Seeded 10 products');
  await pool.end();
}

seed().catch(console.error);
