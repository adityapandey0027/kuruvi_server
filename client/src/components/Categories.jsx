function Categories() {

  const categories = [
    "Electronics",
    "Mobiles",
    "Fashion",
    "Appliances",
    "Furniture",
    "Books",
    "Toys"
  ];

  return (
    <div className="bg-white shadow flex justify-around py-3">

      {categories.map((cat, index) => (
        <div
          key={index}
          className="cursor-pointer text-gray-700 hover:text-blue-600 font-medium"
        >
          {cat}
        </div>
      ))}

    </div>
  );
}

export default Categories;