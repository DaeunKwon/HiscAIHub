# AI 공유 허브 (Hisc AI Hub)

한화 임직원(@hanwha.com)을 위한 프롬프트·에이전트 공유 허브. Next.js(App Router) + Prisma/PostgreSQL 기반이며, 프롬프트/에이전트 "만들기"(AI 자동 생성)는 백엔드에서 Anthropic API를 호출하고, "실행"은 claude.ai 딥링크로 각자 PC에서 수행합니다.

## 시작하기

### 1. 환경 변수

```bash
cp .env.example .env
```

`.env`에서 최소한 다음 값을 채워야 합니다:

- `DATABASE_URL` — 로컬은 아래 docker-compose 기본값 사용 가능
- `AUTH_SECRET`, `ADMIN_SECRET` — 세션 서명 키
- `ALLOWED_EMAIL_DOMAIN`, `EMPLOYEE_DEV_PASSWORD` — 임직원 임시 로그인 (추후 Azure AD SSO로 교체 예정)
- `ADMIN_ID`, `ADMIN_PW` — 관리자 임시 로그인 (임직원 인증과 분리)
- `ANTHROPIC_API_KEY` — 프롬프트/에이전트 자동 생성용 (프런트에 노출 금지, 백엔드 경유만)

### 2. 로컬 DB 실행

```bash
docker compose up -d
```

### 3. 스키마 적용 및 시드 데이터

```bash
npx prisma migrate dev
npm run db:seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

## 주요 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run db:seed` | 시드 데이터 삽입 (`prisma/seed.ts`) |
| `npx prisma migrate dev` | 로컬 마이그레이션 적용 |

## 참고

- 디자인 기준: `design-reference/`의 세 HTML 파일 (임의 변경 금지)
- 프로젝트 규칙: [`CLAUDE.md`](./CLAUDE.md)
