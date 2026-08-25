import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vidéos" },
  { href: "/dashboard/channels", label: "Chaînes" },
  { href: "/dashboard/clips", label: "Clips" },
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-bold text-brand-700">
            SAAS-Edit
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-slate-600">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand-600">
                {item.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
