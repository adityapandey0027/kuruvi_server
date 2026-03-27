import Navbar from "./Navbar";

function Layout({ role, children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar role={role} />

      <main className="p-6">
        {children}
      </main>

    </div>
  );
}

export default Layout;