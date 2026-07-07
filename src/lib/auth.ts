// 임직원 인증 (현재: @hanwha.com 도메인 검증 + 임시 공용 비밀번호).
// 추후 이 파일의 자격 검증부만 Azure AD SSO(Auth.js provider)로 교체하면 됨.
import { cookies } from "next/headers";
import { signSession, verifySession } from "./session";

export const EMPLOYEE_COOKIE = "aihub_session";

export type EmployeeSession = {
  email: string;
  name: string;
  dept: string;
};

function authSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-employee-secret";
}

export function allowedDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN ?? "hanwha.com").toLowerCase();
}

export function isValidEmployeeEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@" + allowedDomain());
}

// 임시 자격 검증: 도메인 + 공용 비밀번호. (SSO 교체 지점)
export function verifyEmployeeCredentials(email: string, password: string): boolean {
  const devPw = process.env.EMPLOYEE_DEV_PASSWORD ?? "";
  return isValidEmployeeEmail(email) && devPw.length > 0 && password === devPw;
}

// 이메일에서 임시 표시명 파생 (실제 이름은 SSO 프로필에서 받을 예정).
export function deriveEmployee(email: string): EmployeeSession {
  const local = email.split("@")[0] || email;
  return { email, name: local, dept: "임직원" };
}

export async function createEmployeeSession(session: EmployeeSession): Promise<void> {
  const token = await signSession({ ...session }, authSecret());
  const store = await cookies();
  store.set(EMPLOYEE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const token = (await cookies()).get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;
  return verifySession<EmployeeSession>(token, authSecret());
}

export async function clearEmployeeSession(): Promise<void> {
  (await cookies()).delete(EMPLOYEE_COOKIE);
}
