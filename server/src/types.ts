export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  customer_name: string;
  customer_email: string;
  idempotency_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at: Date;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
