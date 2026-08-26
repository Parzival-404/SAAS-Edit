"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vidéos" },
  { href: "/dashboard/channels", label: "Chaînes" },
  { href: "/dashboard/clips", label: "Clips" },
  { href: "/dashboard/publishing", label: "Publication" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/inspiration", label: "Inspiration" },
  { href: "/dashboard/settings", label: "Paramètres" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-6 mt-3 flex gap-1 overflow-x-auto whitespace-nowrap px-6 text-sm font-medium">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === item.href : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
