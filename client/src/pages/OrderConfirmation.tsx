import { useParams, Link } from 'react-router-dom';

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
          <p className="text-gray-400 mb-2">Your order number is:</p>
          <p className="text-2xl font-mono text-blue-400 mb-6">{orderNumber}</p>
          <p className="text-gray-400 mb-6">
            You will receive a confirmation email shortly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to={`/order/${orderNumber}`}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Track Order
            </Link>
            <Link
              to="/products"
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
