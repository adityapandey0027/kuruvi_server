function ProductCard({ product }) {
  return (
    <div className="bg-white p-4 shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col cursor-pointer group">
      <div className="overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="h-48 w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-800 truncate">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          <span className="text-xs text-green-600 font-semibold">Special Price</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Free delivery</p>
      </div>
    </div>
  );
}

export default ProductCard;