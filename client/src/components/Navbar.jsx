import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import LoginDialog from "../features/auth/LoginDialog";
function Navbar() {

  const [openLogin, setOpenLogin] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <div className="text-blue-600 text-xl font-bold">
        FlipShop
      </div>

      {/* Search Bar */}
      <div className="flex w-1/2">
        <input
          type="text"
          placeholder="Search for products"
          className="w-full border rounded-l px-4 py-2 outline-none"
        />
        <button className="bg-blue-500 text-white px-4 rounded-r">
          Search
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">

        <button
          onClick={() => setOpenLogin(true)}
          className="text-blue-600 font-semibold"
        >
          Login
        </button>

        <div className="flex items-center gap-2 cursor-pointer">
          <ShoppingCart size={22} />
          Cart
        </div>

      </div>

      <LoginDialog open={openLogin} setOpen={setOpenLogin} />

    </nav>
  );
}

export default Navbar;