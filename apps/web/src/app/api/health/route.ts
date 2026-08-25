import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Vérification de santé pour les plateformes de déploiement (Vercel,
 * Railway, uptime monitoring...) — confirme que l'app répond ET que la
 * DB est joignable, sans exposer de détail interne.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", detail: "database unreachable" }, { status: 503 });
  }
}
