"use server";

import { redirect } from "next/navigation";
import {
  createEmployeeSession,
  clearEmployeeSession,
  verifyEmployeeCredentials,
  deriveEmployee,
} from "@/lib/auth";
import {
  createAdminSession,
  clearAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const id = String(formData.get("email") ?? "").trim();
  const pw = String(formData.get("password") ?? "");

  if (!id || !pw) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  // 관리자 경로 (임직원 인증과 분리)
  if (verifyAdminCredentials(id, pw)) {
    await createAdminSession(id);
    redirect("/admin");
  }

  // 임직원 경로 (@hanwha.com 도메인 검증 + 임시 비번)
  if (verifyEmployeeCredentials(id, pw)) {
    await createEmployeeSession(deriveEmployee(id));
    redirect("/");
  }

  return {
    error:
      "이메일(@hanwha.com) 또는 비밀번호가 올바르지 않습니다. (관리자는 admin / admin)",
  };
}

export async function logout(): Promise<void> {
  await clearEmployeeSession();
  redirect("/login");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/login");
}
