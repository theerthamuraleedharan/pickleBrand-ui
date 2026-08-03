import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="border-b border-amber-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
