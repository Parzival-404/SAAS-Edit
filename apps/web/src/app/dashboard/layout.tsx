import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUserId();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="shrink-0 whitespace-nowrap text-[15px] font-semibold tracking-tight text-slate-900">
              SAAS-Edit
            </Link>
            <SignOutButton />
          </div>
          <DashboardNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
