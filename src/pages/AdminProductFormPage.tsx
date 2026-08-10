import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createAdminProduct,
  getAdminProduct,
  updateAdminProduct,
} from "../api/AdminProductApi";

import { getApiErrorMessage }
  from "../utils/getApiErrorMessage";

import type {
  AdminProductRequest,
} from "../types/AdminProduct";

const emptyProduct: AdminProductRequest = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  weightGrams: 500,
  spiceLevel: "MEDIUM",
  category: "VEG",
  active: true,
};

export function AdminProductFormPage() {
  const { productId } = useParams();

  const navigate = useNavigate();

  const editing = Boolean(productId);

  const [product, setProduct] =
    useState<AdminProductRequest>(
      emptyProduct
    );

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    async function loadProduct() {
      try {
        const existing =
          await getAdminProduct(
            Number(productId)
          );

        setProduct({
          name: existing.name,
          description:
            existing.description,
          price: existing.price,
          stockQuantity:
            existing.stockQuantity,
          weightGrams:
            existing.weightGrams,
          spiceLevel:
            existing.spiceLevel,
          category:
            existing.category,
          active:
            existing.active,
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      }
    }

    void loadProduct();
  }, [productId]);

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhoto(file);

    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhotoPreview(
      URL.createObjectURL(file)
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage(null);

      if (editing) {
        await updateAdminProduct(
          Number(productId),
          product,
          photo
        );
      } else {
        await createAdminProduct(
          product,
          photo
        );
      }

      navigate(
        "/admin/products"
      );

    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error)
      );

    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() =>
            navigate("/admin/products")
          }
          className="mb-5 font-semibold text-emerald-700"
        >
          ← Products
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-sm">

          <h1 className="text-3xl font-black">
            {editing
              ? "Edit product"
              : "Add product"}
          </h1>

          {errorMessage && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >

            <input
              value={product.name}
              onChange={(event) =>
                setProduct({
                  ...product,
                  name:
                    event.target.value,
                })
              }
              placeholder="Product name"
              required
              className="w-full rounded-xl border px-4 py-3"
            />

            <textarea
              value={product.description}
              onChange={(event) =>
                setProduct({
                  ...product,
                  description:
                    event.target.value,
                })
              }
              placeholder="Description"
              required
              rows={5}
              className="w-full rounded-xl border px-4 py-3"
            />

            <div className="grid gap-5 sm:grid-cols-2">

              <label>
                <span className="mb-2 block font-semibold">
                  Price
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={product.price}
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      price:
                        Number(
                          event.target.value
                        ),
                    })
                  }
                  required
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block font-semibold">
                  Stock
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    product.stockQuantity
                  }
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      stockQuantity:
                        Number(
                          event.target.value
                        ),
                    })
                  }
                  required
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block font-semibold">
                  Weight (grams)
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    product.weightGrams
                  }
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      weightGrams:
                        Number(
                          event.target.value
                        ),
                    })
                  }
                  required
                  className="w-full rounded-xl border px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block font-semibold">
                  Category
                </span>

                <select
                  value={product.category}
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      category:
                        event.target
                          .value as
                          AdminProductRequest["category"],
                    })
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="VEG">
                    Veg
                  </option>

                  <option value="NON_VEG">
                    Non-Veg
                  </option>

                  <option value="MIXED">
                    Mixed
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-2 block font-semibold">
                  Spice level
                </span>

                <select
                  value={
                    product.spiceLevel
                  }
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      spiceLevel:
                        event.target
                          .value as
                          AdminProductRequest["spiceLevel"],
                    })
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="MILD">
                    Mild
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HOT">
                    Hot
                  </option>
                </select>
              </label>

            </div>

            <div>
              <p className="mb-2 font-semibold">
                Product photo
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={
                  handlePhotoChange
                }
              />

              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Product preview"
                  className="mt-4 h-48 w-48 rounded-2xl object-cover"
                />
              )}
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={product.active}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    active:
                      event.target.checked,
                  })
                }
              />

              Product is active
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editing
                ? "Update product"
                : "Add product"}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}