import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/client';
import { CartItem } from '../components/CartItem';

interface CartItemData {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.product_id !== productId));
    } else {
      setItems(prev => prev.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.name = 'Name is required';
    if (!customerEmail.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(customerEmail)) newErrors.email = 'Invalid email format';
    if (items.length === 0) newErrors.cart = 'Cart is empty';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const order = await ordersApi.create({
        customer_name: customerName,
        customer_email: customerEmail,
        items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      }, idempotencyKey);

      navigate(`/order/${order.data.order_number}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to place order';
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">Your cart is empty</p>
            <a href="/products" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              Browse Products
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map(item => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Checkout</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-bold">${total.toFixed(2)}</span>
                </div>
              </div>

              {errors.submit && (
                <p className="text-red-400 text-sm mt-4">{errors.submit}</p>
              )}

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
