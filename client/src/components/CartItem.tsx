interface CartItemData {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
      <div className="flex-1">
        <h4 className="text-white font-medium">{item.product_name || `Product #${item.product_id}`}</h4>
        <p className="text-gray-400 text-sm">${item.unit_price} each</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center"
          >
            -
          </button>
          <span className="text-white w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center"
          >
            +
          </button>
        </div>
        <span className="text-white font-semibold w-24 text-right">
          ${(item.unit_price * item.quantity).toFixed(2)}
        </span>
        <button
          onClick={() => onRemove(item.product_id)}
          className="text-red-400 hover:text-red-300 ml-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
