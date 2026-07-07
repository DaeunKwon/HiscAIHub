import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listAuditLogs } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? undefined;
  const daysParam = searchParams.get("days");
  const days = daysParam ? Number(daysParam) : undefined;
  const format = searchParams.get("format");

  const logs = await listAuditLogs({ action, days });

  if (format === "csv") {
    const header = "시간,사용자,작업,대상,파일,상태";
    const rows = logs.map((l) => [l.time, l.user, l.action, l.target, l.files, l.status].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log.csv"`,
      },
    });
  }

  return NextResponse.json({ logs });
}
