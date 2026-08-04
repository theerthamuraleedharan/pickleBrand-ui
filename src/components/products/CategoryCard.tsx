interface CategoryCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export function CategoryCard({
  title,
  description,
  icon,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-3xl border border-amber-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
        <span
          className="text-7xl transition group-hover:scale-110"
          role="img"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-black text-gray-900">
          {title}
        </h2>

        <p className="mt-3 leading-7 text-gray-600">
          {description}
        </p>

        <span className="mt-5 inline-block font-bold text-emerald-700">
          Explore pickles →
        </span>
      </div>
    </button>
  );
}