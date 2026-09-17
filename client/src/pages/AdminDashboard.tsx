import { useState, useEffect, useCallback } from 'react';
import { adminApi, Order, Product } from '../api/client';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, productsRes, revenueRes] = await Promise.all([
        adminApi.stats(),
        adminApi.orders({ status: statusFilter || undefined }),
        adminApi.products({ active: true }),
        adminApi.revenue()
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setRevenue(revenueRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStockUpdate = async (productId: number, quantity: number) => {
    try {
      await adminApi.updateStock(productId, quantity, 'increment');
      fetchData();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Orders</div>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold text-green-400">
              ${parseFloat(stats?.total_revenue || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Pending Orders</div>
            <div className="text-2xl font-bold text-yellow-400">{stats?.pending_orders || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Low Stock Alerts</div>
            <div className="text-2xl font-bold text-red-400">{stats?.low_stock_products || 0}</div>
          </div>
        </div>

        {revenue?.dailyRevenue?.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Orders</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 rounded px-3 py-1 text-sm"
              >
                <option value="">All Status</option>
                <option value="created">Created</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-700">
                      <td className="py-2 font-mono text-xs">{order.order_number}</td>
                      <td className="py-2">{order.customer_name}</td>
                      <td className="py-2">${order.total_amount}</td>
                      <td className="py-2"><OrderStatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-gray-700">
                      <td className="py-2">{product.name}</td>
                      <td className="py-2">${product.price}</td>
                      <td className={`py-2 ${product.stock_quantity < 10 ? 'text-red-400' : ''}`}>
                        {product.stock_quantity}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleStockUpdate(product.id, 10)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          +10 Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
