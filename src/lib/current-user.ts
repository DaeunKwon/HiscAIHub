// 세션(이메일/이름/부서)을 DB User 행으로 변환. 없으면 최초 로그인 시점에 생성.
import { getEmployeeSession } from "./auth";
import { db } from "./db";
import type { User } from "@prisma/client";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getEmployeeSession();
  if (!session) return null;
  return db.user.upsert({
    where: { email: session.email },
    update: { lastActiveAt: new Date() },
    create: { email: session.email, name: session.name, dept: session.dept },
  });
}
