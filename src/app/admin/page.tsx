import { redirect } from "next/navigation";
import AdminConsole from "@/components/AdminConsole";
import { getAdminSession } from "@/lib/admin-auth";
import "@/styles/admin.css";

export const metadata = {
  title: "AI 활용 허브 · 관리자",
};

export default async function AdminPage() {
  // 미들웨어가 1차 가드하지만, 서버에서도 재확인
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return <AdminConsole />;
}
