import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session";
import { EMPLOYEE_COOKIE } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 관리자 영역: 관리자 세션 필요 (임직원 세션과 분리)
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const session =
      token && (await verifySession(token, process.env.ADMIN_SECRET ?? "dev-admin-secret"));
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 그 외 보호 영역: 임직원 세션 필요
  const token = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  const session =
    token && (await verifySession(token, process.env.AUTH_SECRET ?? "dev-employee-secret"));
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

// 로그인·정적파일·API는 미들웨어 제외
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"],
};
