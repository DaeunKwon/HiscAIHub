import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSettingsAdmin, saveSettingsAdmin, updateSensitiveKeywords } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await getSettingsAdmin();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  if (Array.isArray(body.sensitiveKeywords)) {
    await updateSensitiveKeywords(body.sensitiveKeywords.map((k: unknown) => String(k)));
  }

  if (typeof body.registrationWarning === "string" || typeof body.globalDailyCallLimit === "number") {
    const current = await getSettingsAdmin();
    await saveSettingsAdmin({
      registrationWarning: typeof body.registrationWarning === "string" ? body.registrationWarning : current.registrationWarning,
      globalDailyCallLimit: typeof body.globalDailyCallLimit === "number" ? body.globalDailyCallLimit : current.globalDailyCallLimit,
    });
  }

  return NextResponse.json({ ok: true });
}
