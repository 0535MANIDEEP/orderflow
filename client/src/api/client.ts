import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  customer_name: string;
  customer_email: string;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export const productsApi = {
  list: (params?: { page?: number; limit?: number; active?: boolean; search?: string }) =>
    api.get<{ data: Product[]; pagination: any }>('/products', { params }),
  get: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`)
};

export const ordersApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ data: Order[]; pagination: any }>('/orders', { params }),
  get: (id: number) => api.get<Order>(`/orders/${id}`),
  getByNumber: (orderNumber: string) => api.get<Order>(`/orders/number/${orderNumber}`),
  create: (data: { customer_name: string; customer_email: string; items: { product_id: number; quantity: number }[] }, idempotencyKey: string) =>
    api.post<Order>('/orders', data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  updateStatus: (id: number, status: string) => api.put<Order>(`/orders/${id}/status`, { status })
};

export const adminApi = {
  stats: () => api.get<any>('/admin/stats'),
  orders: (params?: { status?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<Order[]>('/admin/orders', { params }),
  products: (params?: { active?: boolean; lowStock?: boolean }) =>
    api.get<Product[]>('/admin/products', { params }),
  updateStock: (id: number, quantity: number, mode: 'increment' | 'set') =>
    api.put<Product>(`/admin/products/${id}/stock`, { quantity, mode }),
  revenue: () => api.get<any>('/admin/revenue')
};

export default api;
