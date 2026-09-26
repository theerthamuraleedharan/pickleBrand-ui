import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { LoginPage } from "./pages/Login";
import { CartPage } from "./pages/CartPage";
import { ProductListPage } from "./pages/ProductListPage";
import { RegisterPage } from "./pages/Register";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import { AdminRoute } from "./api/AdminRoute";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboard";
import { AdminProductsPage } from "./pages/AdminProductPages";
import { AdminProductFormPage } from "./pages/AdminProductFormPage";

function App() {
  return (
    <Routes>
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/login"
        element={<AdminLoginPage />}
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminProductsPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AdminProductFormPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/products/:productId/edit"
        element={
          <AdminRoute>
            <AdminProductFormPage />
          </AdminRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
