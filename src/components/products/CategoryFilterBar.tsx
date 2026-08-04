import type { ProductCategory } from "../../types/Product";

interface CategoryFilterBarProps {
  selectedCategory: ProductCategory;
  onCategoryChange: (
    category: ProductCategory
  ) => void;
}

interface CategoryOption {
  value: ProductCategory;
  label: string;
  icon: "leaf" | "fish" | "jar";
  selectedClassName: string;
  iconClassName: string;
}

const categories: CategoryOption[] = [
  {
    value: "VEG",
    label: "Veg",
    selectedClassName:
      "bg-gradient-to-r from-emerald-800 to-lime-700 text-white shadow-lg shadow-emerald-900/25",
    iconClassName:
      "bg-emerald-100 text-emerald-800",
    icon: "leaf",
  },
  {
    value: "NON_VEG",
    label: "Non-Veg",
    selectedClassName:
      "bg-gradient-to-r from-rose-800 to-orange-700 text-white shadow-lg shadow-rose-900/25",
    iconClassName: "bg-rose-100 text-rose-800",
    icon: "fish",
  },
  {
    value: "MIXED",
    label: "Mixed",
    selectedClassName:
      "bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg shadow-amber-900/25",
    iconClassName: "bg-amber-100 text-amber-800",
    icon: "jar",
  },
];

function CategoryIcon({
  icon,
}: {
  icon: CategoryOption["icon"];
}) {
  if (icon === "leaf") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M5 21c8 0 14-6 14-14V3h-4C7 3 3 7 3 13c0 3 2 6 5 7" />
        <path d="M4 20c4-5 8-8 15-11" />
      </svg>
    );
  }

  if (icon === "fish") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M6 12c2-4 6-6 11-6l4 6-4 6c-5 0-9-2-11-6Z" />
        <path d="M3 9v6l3-3-3-3Z" />
        <path d="M16 11h.01" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3h8" />
      <path d="M10 3v4l-2 2v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9l-2-2V3" />
      <path d="M8 13h8" />
      <path d="M10 16h.01" />
      <path d="M14 17h.01" />
    </svg>
  );
}

export function CategoryFilterBar({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterBarProps) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-2xl shadow-emerald-950/10 ring-1 ring-white">
      <div className="flex w-full flex-nowrap items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 via-white to-amber-50 p-2">
        {categories.map((category) => {
          const selected =
            category.value === selectedCategory;

          return (
            <button
              key={category.value}
              type="button"
              onClick={() =>
                onCategoryChange(category.value)
              }
              aria-pressed={selected}
              className={`group relative flex h-13 flex-1 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl border px-4 text-sm font-black transition duration-200 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-amber-200 active:scale-[0.98] sm:h-16 sm:gap-4 sm:text-base ${
                selected
                  ? `${category.selectedClassName} border-transparent`
                  : "border-amber-100 bg-white text-gray-700 shadow-md shadow-amber-900/5 hover:border-amber-200 hover:bg-white hover:text-emerald-900 hover:shadow-lg hover:shadow-emerald-950/10"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1 ${
                  selected
                    ? "bg-white/70"
                    : "bg-amber-200/80"
                }`}
              />

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition sm:h-9 sm:w-9 ${
                  selected
                    ? "bg-white/95 text-emerald-950"
                    : category.iconClassName
                }`}
              >
                <CategoryIcon icon={category.icon} />
              </span>

              <span className="whitespace-nowrap">
                {category.label}
              </span>

              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 h-1 w-10 rounded-full bg-white/85"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
