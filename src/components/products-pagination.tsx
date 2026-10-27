import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function catalogHref(filters: {
  q?: string;
  brand?: string;
  category?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function pageItems(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("ellipsis");
  items.push(total);
  return items;
}

export default function ProductsPagination({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: { q: string; brand: string; category: string; sort: string };
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? catalogHref({ ...filters, page: page - 1 }) : null;
  const next = page < totalPages ? catalogHref({ ...filters, page: page + 1 }) : null;

  return (
    <nav
      aria-label="Product pages"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {prev ? (
        <Link
          href={prev}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold hover:border-orange-300 hover:text-orange-600"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-100 px-4 py-2 text-sm font-bold text-zinc-300">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </span>
      )}

      {pageItems(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e-${index}`} className="px-1 text-zinc-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={catalogHref({ ...filters, page: item })}
            aria-current={item === page ? "page" : undefined}
            className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-2 text-sm font-bold ${
              item === page
                ? "bg-zinc-950 text-white"
                : "border border-zinc-200 bg-white hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {next ? (
        <Link
          href={next}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold hover:border-orange-300 hover:text-orange-600"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-100 px-4 py-2 text-sm font-bold text-zinc-300">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
