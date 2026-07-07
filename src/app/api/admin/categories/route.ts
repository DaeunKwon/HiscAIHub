import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listCategoriesAdmin, addCategoryAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const categories = await listCategoriesAdmin();
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "카테고리 이름을 입력해주세요." }, { status: 400 });

  await addCategoryAdmin(name);
  const categories = await listCategoriesAdmin();
  return NextResponse.json({ categories });
}
