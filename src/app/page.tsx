import AppShell from "@/components/AppShell";
import { getCurrentUser } from "@/lib/current-user";
import { listPrompts } from "@/lib/prompts";
import { listAgents } from "@/lib/agents";
import "@/styles/prompt-board.css";

export default async function Home() {
  const dbUser = await getCurrentUser();
  const [prompts, agents] = dbUser
    ? await Promise.all([listPrompts(dbUser.id), listAgents(dbUser.id)])
    : [[], []];
  const user = {
    name: dbUser?.name ?? "",
    dept: dbUser?.dept ?? "임직원",
    email: dbUser?.email ?? "",
  };
  return <AppShell user={user} initialPrompts={prompts} initialAgents={agents} />;
}
