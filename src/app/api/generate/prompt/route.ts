import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generatePrompt } from "@/lib/generate";
import { friendlyClaudeError } from "@/lib/anthropic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const cat = String(body.cat ?? "").trim() || "리서치";
  const task = String(body.task ?? "").trim();
  if (!task) return NextResponse.json({ error: "하려는 업무를 입력해주세요." }, { status: 400 });

  try {
    const result = await generatePrompt(user.id, cat, task);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: friendlyClaudeError(e) }, { status: 502 });
  }
}
