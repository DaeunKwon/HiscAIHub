"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { BulbIcon, BotIcon, ChartIcon, SearchIcon } from "@/components/icons";
import "@/styles/login.css";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <div className="login-page">
      {/* 좌측 브랜딩 (데모 그대로) */}
      <div className="login-left">
        <div className="login-left-logo">
          <div className="login-left-logo-sq">
            <BulbIcon size={15} />
          </div>
          <div>
            <div className="login-left-logo-name">AI 활용 허브</div>
            <div className="login-left-logo-sub">한화투자증권 임직원 전용</div>
          </div>
        </div>

        <div className="login-left-copy">
          <h2>
            에이전트는 한 곳에서,
            <br />
            AI 활용 현황은 한눈에
          </h2>
          <p>
            임직원이 만든 Claude 에이전트를 찾아 바로 실행하고,
            <br />팀·부서별 활용도와 구독 현황을 대시보드로 확인하세요.
          </p>
        </div>

        <div className="login-features">
          <div className="login-feat">
            <div className="login-feat-icon">
              <ChartIcon size={15} />
            </div>
            <div>
              <div className="login-feat-title">활용도 · 구독 현황 대시보드</div>
              <div className="login-feat-desc">
                누가 얼마나 쓰고, 어떤 업무에, 어느 부서까지 퍼졌는지 — 실행·등록 지표와 부서별 확산 현황을 임직원 누구나 확인
              </div>
            </div>
          </div>
          <div className="login-feat">
            <div className="login-feat-icon">
              <SearchIcon size={15} />
            </div>
            <div>
              <div className="login-feat-title">업무별 에이전트 탐색</div>
              <div className="login-feat-desc">
                리서치, 보고서, 고객응대, 코딩 등 카테고리별로 검증된 에이전트를 찾아 Claude로 바로 실행
              </div>
            </div>
          </div>
          <div className="login-feat">
            <div className="login-feat-icon">
              <BotIcon size={15} />
            </div>
            <div>
              <div className="login-feat-title">나만의 에이전트 등록</div>
              <div className="login-feat-desc">
                직접 만들거나 AI 초안 생성으로 에이전트를 등록하고 동료의 후기를 확인해보세요
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="login-right">
        <div className="login-box">
          <div className="login-greeting">안녕하세요 👋</div>
          <div className="login-sub">
            회사 이메일과 비밀번호를 입력하면
            <br />별도 가입 없이 바로 이용할 수 있어요.
          </div>

          <form action={formAction}>
            <div className="login-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="name@hanwha.com"
              />
              <div className="login-field-hint">@hanwha.com 계정만 로그인 가능합니다</div>
            </div>
            <div className="login-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button className="login-btn" type="submit" disabled={pending}>
              {pending ? "로그인 중…" : "로그인"}
            </button>
          </form>

          {state.error ? <div className="login-error">{state.error}</div> : null}

          <div className="login-notice">
            <ShieldMini />
            <p>
              <strong>임직원 전용 서비스입니다.</strong>
              <br />
              @hanwha.com 계정 외에는 접근이 제한되며, 계정 문의는 AI Roll-up TFT로 연락해주세요.
            </p>
          </div>

          <div className="login-footer-note">
            문의 · 오류 신고: AI Roll-up TFT
            <br />© 2026 Hanwha Investment Securities
          </div>
        </div>
      </div>
    </div>
  );
}



function ShieldMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
