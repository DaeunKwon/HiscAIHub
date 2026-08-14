import TopBar from "@/components/TopBar";
import AgentForm from "@/components/agent/AgentForm";
import { getCurrentUser } from "@/lib/current-user";
import "@/styles/prompt-board.css";
import "@/styles/agent-board.css";
import "@/styles/agent-page.css";

export default async function NewAgentPage() {
  const user = await getCurrentUser();

  return (
    <>
      <TopBar
        user={{ name: user?.name ?? "", dept: user?.dept ?? "임직원", email: user?.email ?? "" }}
      />
      <div className="content">
        <AgentForm editing={null} />
      </div>
    </>
  );
}
