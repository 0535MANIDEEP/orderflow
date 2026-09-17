import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi, Order } from '../api/client';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

const statusSteps = ['created', 'paid', 'shipped', 'delivered'];

export function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;
      try {
        const response = await ordersApi.getByNumber(orderNumber);
        setOrder(response.data);
      } catch (err) {
        setError('Order not found');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;
  if (!order) return null;

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Order {order.order_number}</h1>
        <p className="text-gray-400 mb-8">Placed on {new Date(order.created_at).toLocaleDateString()}</p>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="flex items-center justify-between mb-4">
            <OrderStatusBadge status={order.status} />
            {order.status === 'cancelled' && (
              <span className="text-red-400">This order has been cancelled</span>
            )}
          </div>

          {order.status !== 'cancelled' && (
            <div className="flex items-center justify-between mt-6">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-700'
                  }`}>
                    {index <= currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span className="text-sm mt-2 capitalize">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                  <p className="text-white">{item.product_name || `Product #${item.product_id}`}</p>
                  <p className="text-gray-400 text-sm">Qty: {item.quantity} × ${item.unit_price}</p>
                </div>
                <p className="text-white font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 mt-4 pt-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold">${order.total_amount}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <p className="text-gray-400">{order.customer_name}</p>
          <p className="text-gray-400">{order.customer_email}</p>
        </div>
      </div>
    </div>
  );
}
