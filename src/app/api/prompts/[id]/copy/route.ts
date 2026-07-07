import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const updated = await db.prompt.update({
    where: { id },
    data: { copyCount: { increment: 1 } },
  });
  return NextResponse.json({ copies: updated.copyCount });
}
