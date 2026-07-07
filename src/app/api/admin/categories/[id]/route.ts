import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { removeCategoryAdmin } from "@/lib/admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await removeCategoryAdmin(id);
  return NextResponse.json({ ok: true });
}
