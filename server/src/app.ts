import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

async function start() {
  await initDb();
  
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`OrderFlow server running on port ${PORT}`);
    });
  }
}

start().catch(console.error);

export { app };
