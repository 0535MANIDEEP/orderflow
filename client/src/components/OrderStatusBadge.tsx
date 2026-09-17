interface OrderStatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  created: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-blue-900 text-blue-300',
  shipped: 'bg-purple-900 text-purple-300',
  delivered: 'bg-green-900 text-green-300',
  cancelled: 'bg-red-900 text-red-300'
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-700 text-gray-300'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
