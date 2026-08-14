import AppShell from "@/components/AppShell";
import { getCurrentUser } from "@/lib/current-user";
import { listAgents } from "@/lib/agents";
import "@/styles/prompt-board.css";
import "@/styles/dashboard.css";

export default async function Home() {
  const dbUser = await getCurrentUser();
  const agents = dbUser ? await listAgents(dbUser.id) : [];
  const user = {
    name: dbUser?.name ?? "",
    dept: dbUser?.dept ?? "임직원",
    email: dbUser?.email ?? "",
  };
  return <AppShell user={user} initialAgents={agents} />;
}
