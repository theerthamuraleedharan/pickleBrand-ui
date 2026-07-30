import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthLandingPage } from "./pages/AuthLandingPage";
import { ProductListPage } from "./pages/ProductListPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<AuthLandingPage />}
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
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;