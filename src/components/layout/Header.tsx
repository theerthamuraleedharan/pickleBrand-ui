import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/cartContext";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navClass = (path: string) =>
    `rounded-full px-4 py-2 text-base font-semibold transition ${
      location.pathname === path
        ? "bg-emerald-50 text-emerald-900"
        : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
    }`;

  function handleLogout() {
    void logout()
      .then(() => {
        navigate("/login", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/products" className="flex min-w-0 items-center gap-3 rounded-xl">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-xl text-amber-200 shadow-sm" aria-hidden="true">
            S
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black tracking-tight text-emerald-950 sm:text-xl">
              Sujus Pickle
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
              Small-batch goodness
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
          <Link to="/products" aria-current={location.pathname === "/products" ? "page" : undefined} className={navClass("/products")}>
            Shop
          </Link>
          <Link to="/profile" aria-current={location.pathname === "/profile" ? "page" : undefined} className={navClass("/profile")}>
            My profile
          </Link>
          <Link to="/cart" aria-current={location.pathname === "/cart" ? "page" : undefined} className={`${navClass("/cart")} relative`}>
            Cart
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-900 px-1.5 py-0.5 text-xs font-bold text-white" aria-live="polite">
              {itemCount}
            </span>
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <span className="hidden max-w-36 truncate text-right text-sm font-medium text-slate-600 md:block">
              Hi, {user.firstName}
            </span>
          )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 sm:px-4"
        >
          Sign out
        </button>
        </div>
      </div>
    </header>
  );
}
