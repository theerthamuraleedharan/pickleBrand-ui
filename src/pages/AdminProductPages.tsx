import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  deleteAdminProduct,
  getAdminProducts,
} from "../api/AdminProductApi";

import { AdminHeader } from "../components/admin/AdminHeader";
import type {
  AdminProduct,
} from "../types/AdminProduct";

import {
  getApiErrorMessage,
} from "../utils/getApiErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080/api";

function resolveImageUrl(
  imageUrl: string | null
): string | null {

  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const backendOrigin =
    API_BASE_URL.replace(
      /\/api\/?$/,
      ""
    );

  return backendOrigin + imageUrl;
}

export function AdminProductsPage() {

  const [products, setProducts] =
    useState<AdminProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);

      const result =
        await getAdminProducts();

      setProducts(result);

    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error)
      );

    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(
    product: AdminProduct
  ) {

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminProduct(
        product.id
      );

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id
        )
      );

    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error)
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Products"
        subtitle="Manage your pickle catalogue."
      >
        <Link
          to="/admin/products/new"
          className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-amber-200"
        >
          Add product
        </Link>
      </AdminHeader>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <p className="mt-8">
            Loading products...
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">

              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                <tr>
                  <th className="p-4">
                    Product
                  </th>

                  <th className="p-4">
                    Category
                  </th>

                  <th className="p-4">
                    Price
                  </th>

                  <th className="p-4">
                    Stock
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4">
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody>

                {products.map(
                  (product) => {

                    const photo =
                      resolveImageUrl(
                        product.imageUrl
                      );

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                      >

                        <td className="p-4">
                          <div className="flex items-center gap-4">

                            {photo ? (
                              <img
                                src={photo}
                                alt={product.name}
                                className="h-14 w-14 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
                                🫙
                              </div>
                            )}

                            <span className="font-semibold text-slate-900">
                              {product.name}
                            </span>

                          </div>
                        </td>

                        <td className="p-4">
                          {product.category}
                        </td>

                        <td className="p-4">
                          €
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </td>

                        <td className="p-4">
                          {product.stockQuantity}
                        </td>

                        <td className="p-4">

                          {product.active ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                              Inactive
                            </span>
                          )}

                        </td>

                        <td className="p-4">

                          <div className="flex gap-3">

                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="font-semibold text-emerald-800 transition hover:text-emerald-950"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  product
                                )
                              }
                              className="font-semibold text-red-700 transition hover:text-red-900"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>
            </table>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
