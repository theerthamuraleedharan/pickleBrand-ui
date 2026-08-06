interface DashboardStatCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
}

export function DashboardStatCard({
  title,
  value,
  description,
  icon,
}: DashboardStatCardProps) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-gray-500">
          {title}
        </p>

        <p className="mt-2 text-4xl font-black text-gray-900">
          {value.toLocaleString()}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl"
        aria-hidden="true"
      >
        {icon}
      </div>
    </article>
  );
}
