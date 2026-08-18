# AI 활용 허브 (Hisc AI Hub)

한화투자증권 임직원(@hanwha.com)을 위한 **AI 에이전트 공유·실행 허브**. 임직원이 만든 Claude 에이전트를 카테고리별로 탐색·저장·후기 작성하고, 활용도·구독 현황 대시보드를 누구나 볼 수 있습니다.

- 스택: Next.js 16(App Router) + Prisma / PostgreSQL + Tailwind
- 에이전트 "만들기"(AI 초안 생성)만 백엔드에서 Anthropic API를 호출하고, "실행"은 Claude 딥링크로 각자 PC에서 수행합니다 (백엔드 LLM 비용 없음)
- 기획서 개정(2026-08-13)으로 프롬프트 공유·좋아요 기능은 제거되었고 **에이전트 단일 체계**입니다

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
- `ANTHROPIC_API_KEY` — 에이전트 AI 초안 생성용 (프런트에 노출 금지, 백엔드 경유만)

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

- 임직원 로그인: `@hanwha.com` 이메일 + `EMPLOYEE_DEV_PASSWORD` (첫 로그인 시 User 행 자동 생성)
- 관리자 로그인: `ADMIN_ID` / `ADMIN_PW` → `/admin`

### 5. DB 데이터 확인

```bash
npx prisma studio            # http://localhost:5555 (User, Agent 등 테이블 GUI)
docker exec -it aihub-postgres psql -U aihub -d aihub   # 터미널 접속
```

## 주요 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run db:seed` | 시드 데이터 삽입 (`prisma/seed.ts`) |
| `npx prisma migrate dev` | 로컬 마이그레이션 적용 |

## 구조

```
src/app/            페이지·API (agents, agents/[id], agents/new, login, admin, api/*)
src/components/     UI 컴포넌트 (agent, dashboard, AppShell …)
src/lib/            도메인 로직 (auth, agents, dashboard, anthropic, db …)
src/styles/         tokens.css + 화면별 CSS
prisma/             schema.prisma, migrations/, seed.ts(+seed-data.ts)
deploy/             EC2 셋업·배포 스크립트
```

## 참고

- 디자인 기준: `design-reference/`의 HTML 목업 (로컬 전용, git 미포함 · 임의 변경 금지). 현재 기준은 `agent_hub_v3_mockup.html`, 로그인은 `prompt_hub_login_v2.html`
- 기획 문서: `docs/` (로컬 전용, git 미포함)
- 프로젝트 규칙: [`CLAUDE.md`](./CLAUDE.md)

## 배포 (AWS EC2 + Docker Compose + GitHub Actions)

`main` 브랜치에 push 하면 GitHub Actions 가 EC2 에 SSH 로 접속해 `deploy/deploy.sh` 를 실행합니다
(git pull → 이미지 빌드/재기동 → `prisma migrate deploy`).

### 서버 최초 셋업 (1회)

1. EC2(Ubuntu, t3.small 이상) 생성, 탄력적 IP 연결. 보안그룹:
   - 22: GitHub Actions 가 접속하므로 `0.0.0.0/0` (키 인증만 허용됨)
   - 80: **가능하면 사내 IP 대역만** 허용 권장 (임직원 로그인이 공용 비밀번호라 SSO 도입 전까지의 최소 방어선)
2. SSH 접속 후:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/DaeunKwon/HiscAIHub/main/deploy/setup-ec2.sh | bash
   ```
   (Docker 설치, swap, 리포 clone). 끝나면 재로그인.
3. `cd ~/HiscAIHub && cp .env.example .env && nano .env` — 운영 값으로 수정
   - `DATABASE_URL` 호스트를 `postgres` 로, `POSTGRES_PASSWORD` 설정 (`.env.example` 주석 참고)
   - `AUTH_SECRET`, `ADMIN_SECRET`: `openssl rand -base64 32`
   - `ADMIN_PW`(admin/admin 그대로 두지 말 것), `EMPLOYEE_DEV_PASSWORD`, `ANTHROPIC_API_KEY`
   - **`COOKIE_SECURE="false"`** — 도메인/HTTPS 없이 IP(HTTP)로 접속하는 동안 필수. 없으면 세션 쿠키가 저장되지 않아 로그인이 안 됨. HTTPS 적용 후 제거
4. 기동 · 마이그레이션 · 시드
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml --profile tools run --rm --build migrate
   docker compose -f docker-compose.prod.yml --profile tools run --rm seed   # 최초 1회
   ```
5. GitHub 리포 → Settings → Secrets and variables → Actions 에 등록
   - `EC2_HOST` (탄력적 IP), `EC2_USER` (`ubuntu`), `EC2_SSH_KEY` (pem 파일 내용 전체)

이후에는 로컬에서 커밋·push 만 하면 자동 배포됩니다.
스키마를 바꿨다면 `npx prisma migrate dev` 로 만든 마이그레이션 파일을 함께 커밋하세요.
환경변수를 새로 추가했다면 서버 `.env` 에도 직접 넣어야 합니다.

수동 배포: 서버에서 `bash ~/HiscAIHub/deploy/deploy.sh`

### 알아둘 점 (IP/HTTP 파일럿 기준)
- HTTP 에서는 브라우저 클립보드 API 가 막혀 "Claude로 실행" 시 프롬프트 자동 복사가 되지 않음(딥링크 프리필은 동작). HTTPS 적용 시 해결
- DB 는 EC2 의 Docker 볼륨(`pgdata`) 하나에만 있음. 정기 백업: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U aihub aihub > backup.sql`
- `seed` 는 목업 데이터(가짜 사용자·에이전트·로그)를 넣으므로 데모 용도로만. 실사용 전환 시 DB 초기화 후 시드 없이 시작
- 배포 시 이미지 빌드 후 컨테이너 교체로 수십 초 다운타임 발생
