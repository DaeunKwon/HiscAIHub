// 관리자 인증 — 임직원 인증과 완전히 분리된 세션(별도 쿠키/시크릿).
// 현재는 임시 admin/admin(env). 추후 권한체계로 교체 예정.
import { cookies } from "next/headers";
import { signSession, verifySession } from "./session";

export const ADMIN_COOKIE = "aihub_admin";

export type AdminSession = {
  admin: true;
  id: string;
};

function adminSecret(): string {
  return process.env.ADMIN_SECRET ?? "dev-admin-secret";
}

export function verifyAdminCredentials(id: string, password: string): boolean {
  const adminId = process.env.ADMIN_ID ?? "admin";
  const adminPw = process.env.ADMIN_PW ?? "admin";
  return id === adminId && password === adminPw;
}

export async function createAdminSession(id: string): Promise<void> {
  const token = await signSession({ admin: true, id }, adminSecret());
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySession<AdminSession>(token, adminSecret());
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
