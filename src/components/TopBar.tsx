"use client";

import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { BulbIcon } from "@/components/icons";

export type ShellUser = { name: string; dept: string; email: string };

/**
 * 상단바 — 보드와 에이전트 상세·등록 페이지가 함께 쓴다.
 * 사용자 칩은 보드에서는 활동 탭으로 전환하고(onUserClick), 별도 페이지에서는 홈으로 돌아간다.
 */
export default function TopBar({
  user,
  onUserClick,
}: {
  user: ShellUser;
  onUserClick?: () => void;
}) {
  const displayName = user.name || "임직원";
  const initial = displayName.charAt(0) || "H";
  const label = (
    <>
      <span className="dot">{initial}</span> {displayName} · {user.dept}
    </>
  );

  return (
    <div className="topbar">
      <Link href="/" className="logo">
        <div className="logo-sq">
          <BulbIcon size={13} stroke="#fff" />
        </div>
        AI 활용 허브 <span className="logo-sub">· 한화투자증권</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onUserClick ? (
          <div className="user-pill" onClick={onUserClick}>
            {label}
          </div>
        ) : (
          <Link href="/" className="user-pill">
            {label}
          </Link>
        )}
        <form action={logout}>
          <button type="submit" className="tnav" style={{ fontSize: 12, color: "var(--text-3)" }}>
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
