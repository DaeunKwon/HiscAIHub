import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import AgentForm from "@/components/agent/AgentForm";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO } from "@/lib/agents";
import "@/styles/prompt-board.css";
import "@/styles/agent-board.css";
import "@/styles/agent-page.css";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const agent = await getAgentDTO(id, user?.id ?? null);
  if (!agent) notFound();
  // 남의 에이전트는 수정 화면 자체를 열지 않는다. (API도 authorId를 다시 확인한다)
  if (!agent.mine) redirect(`/agents/${id}`);

  return (
    <>
      <TopBar
        user={{ name: user?.name ?? "", dept: user?.dept ?? "임직원", email: user?.email ?? "" }}
      />
      <div className="content">
        <AgentForm editing={agent} />
      </div>
    </>
  );
}
