// 서명된 세션 토큰 헬퍼 (jose, 엣지 미들웨어에서도 동작).
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const encoder = new TextEncoder();

export async function signSession(
  payload: JWTPayload,
  secret: string,
  expiresInSeconds = 60 * 60 * 8, // 8시간
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(encoder.encode(secret));
}

export async function verifySession<T>(
  token: string,
  secret: string,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload as T;
  } catch {
    return null;
  }
}

/**
 * 세션 쿠키 secure 플래그.
 * 기본: production 이면 true(HTTPS 전용). HTTPS 없이 IP 로 운영하는 파일럿에서는
 * .env 에 COOKIE_SECURE=false 를 두어야 브라우저가 쿠키를 저장한다. 도메인·HTTPS 적용 후 제거.
 */
export function cookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE;
  if (v === "false") return false;
  if (v === "true") return true;
  return process.env.NODE_ENV === "production";
}
