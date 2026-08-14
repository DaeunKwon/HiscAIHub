import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import AgentDetail from "@/components/agent/AgentDetail";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO, getAgentTeamRuns } from "@/lib/agents";
import "@/styles/prompt-board.css";
import "@/styles/agent-board.css";
import "@/styles/agent-page.css";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const agent = await getAgentDTO(id, user?.id ?? null);
  if (!agent) notFound();

  const teamRuns = await getAgentTeamRuns(agent.id, agent.dept);

  return (
    <>
      <TopBar
        user={{ name: user?.name ?? "", dept: user?.dept ?? "임직원", email: user?.email ?? "" }}
      />
      {/* 상세는 별도 페이지 — 서브바(탭·검색·등록)와 뷰 헤더는 두지 않는다(v3 목업). */}
      <div className="content">
        <AgentDetail agent={agent} teamRuns={teamRuns} />
      </div>
    </>
  );
}
