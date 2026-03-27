import ProductCard from "./ProductCard";

function ProductGrid() {

  const products = [
    {
      id: 1,
      title: "iPhone 15",
      price: 75000,
      image: "https://m.media-amazon.com/images/I/61l9ppRIiqL.jpg"
    },
    {
      id: 2,
      title: "Laptop",
      price: 55000,
      image: "https://m.media-amazon.com/images/I/71TPda7cwUL.jpg"
    },
    {
      id: 3,
      title: "Headphones",
      price: 2500,
      image: "https://m.media-amazon.com/images/I/61CGHv6kmWL.jpg"
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-4 p-6">

      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}

    </div>
  );
}

export default ProductGrid;