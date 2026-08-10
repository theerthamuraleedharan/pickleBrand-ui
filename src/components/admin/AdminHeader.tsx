import type { ReactNode } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AdminHeader({
  title,
  subtitle,
  children,
}: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  function getNavClass(path: string): string {
    const active =
      path === "/admin"
        ? location.pathname === path
        : location.pathname.startsWith(path);

    return `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-white text-emerald-950"
        : "text-emerald-100 hover:bg-white/10 hover:text-white"
    }`;
  }

  return (
    <header className="bg-emerald-950 px-6 py-6 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-300">
            Sujus Pickle
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm text-emerald-100">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <nav className="flex rounded-2xl bg-white/10 p-1">
            <Link
              to="/admin"
              className={getNavClass("/admin")}
            >
              Dashboard
            </Link>

            <Link
              to="/admin/products"
              className={getNavClass("/admin/products")}
            >
              Products
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {children}

            {user && (
              <p className="hidden max-w-48 truncate text-right text-sm text-emerald-100 sm:block">
                {user.email}
              </p>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-emerald-200/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-emerald-950"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
