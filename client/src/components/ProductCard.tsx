import { Product } from '../api/client';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock_quantity === 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
      <h3 className="text-white font-semibold text-lg">{product.name}</h3>
      {product.description && (
        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{product.description}</p>
      )}
      <div className="mt-auto pt-4">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-white">${product.price}</span>
          <span className={`text-sm ${outOfStock ? 'text-red-400' : 'text-gray-400'}`}>
            {outOfStock ? 'Out of Stock' : `${product.stock_quantity} in stock`}
          </span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={outOfStock}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
