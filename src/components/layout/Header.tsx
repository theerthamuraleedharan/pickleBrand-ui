import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/cartContext";

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  function handleLogout() {
    void logout()
      .then(() => {
        navigate("/login", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }

  return (
    <header className="border-b border-amber-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xl font-black text-emerald-900">
            Sujus Pickle
          </p>

          {user && (
            <p className="text-sm text-gray-500">
              Welcome, {user.firstName}
            </p>
          )}
        </div>

          <Link to="/products" className="font-semibold text-emerald-800">Pickles</Link>
          <Link to="/cart" className="rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-800">
            Cart <span aria-live="polite">({itemCount})</span>
          </Link>
          <Link
            to="/profile"
            className="font-semibold text-emerald-800"
          >
            My profile
          </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-emerald-700 px-4 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
