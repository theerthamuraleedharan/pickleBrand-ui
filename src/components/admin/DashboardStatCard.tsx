import { Link } from "react-router-dom";

interface DashboardStatCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
  to?: string;
}

export function DashboardStatCard({
  title,
  value,
  description,
  icon,
  to,
}: DashboardStatCardProps) {
  const card = (
    <article className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${to ? "transition hover:border-emerald-300 hover:shadow-md" : ""}`}>
      <div>
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
          {value.toLocaleString()}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl ring-1 ring-emerald-100"
        aria-hidden="true"
      >
        {icon}
      </div>
    </article>
  );

  return to ? (
    <Link
      to={to}
      aria-label={`${title}: ${value.toLocaleString()}. ${description}`}
      className="block rounded-2xl focus-visible:outline-emerald-700"
    >
      {card}
    </Link>
  ) : card;
}
