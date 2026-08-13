import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listContent, toggleContentOfficial, toggleContentHidden, deleteContent } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const content = await listContent();
  return NextResponse.json({ content });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id ?? "");
  const action = body.action === "toggle-hide" ? "toggle-hide" : "toggle-official";
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  if (action === "toggle-official") {
    const official = await toggleContentOfficial(id);
    return NextResponse.json({ official });
  }
  const status = await toggleContentHidden(id);
  return NextResponse.json({ status });
}

export async function DELETE(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  await deleteContent(id);
  return NextResponse.json({ ok: true });
}
