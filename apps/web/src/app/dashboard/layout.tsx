import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vidéos" },
  { href: "/dashboard/channels", label: "Chaînes" },
  { href: "/dashboard/clips", label: "Clips" },
  { href: "/dashboard/publishing", label: "Publication" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/inspiration", label: "Inspiration" },
  { href: "/dashboard/settings", label: "Paramètres" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUserId();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="shrink-0 whitespace-nowrap text-lg font-bold text-brand-700">
              SAAS-Edit
            </Link>
            <SignOutButton />
          </div>
          <nav className="-mx-6 mt-3 flex gap-6 overflow-x-auto whitespace-nowrap px-6 text-sm font-medium text-slate-600">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 hover:text-brand-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
