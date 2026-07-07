import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateAgent } from "@/lib/generate";
import { friendlyClaudeError } from "@/lib/anthropic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const cat = String(body.cat ?? "").trim() || "리서치";
  const task = String(body.task ?? "").trim();
  if (!task) return NextResponse.json({ error: "어떤 일을 하는 에이전트인지 입력해주세요." }, { status: 400 });

  try {
    const result = await generateAgent(user.id, cat, task);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: friendlyClaudeError(e) }, { status: 502 });
  }
}
