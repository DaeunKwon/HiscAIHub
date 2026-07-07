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
