// Claude 실행 진입점 (클라이언트 전용).
//
// 동작:
//   - Claude Desktop이 설치돼 있으면 claude://cowork/new?q=<프롬프트> 딥링크로
//     새 작업 창을 열고 입력란에 프롬프트를 자동으로 채운다.
//     (데스크톱 앱은 일반 채팅 프리필 딥링크는 제공하지 않고, cowork/code 표면에서만
//      ?q= 프리필을 지원한다 — 앱 내부 URL 핸들러 분석으로 확인.)
//   - 설치돼 있지 않으면 웹챗(claude.ai/new?q=)을 새 탭으로 연다. 웹도 ?q= 프리필 지원.
//
// 어느 경로든 프롬프트를 클립보드에도 복사해 둔다(자동 입력 실패 시 붙여넣기 대비).
//
// 데스크톱 설치 여부는 브라우저에서 직접 알 수 없으므로, claude:// 실행을 시도한 뒤
// 짧은 시간 내 창 포커스 이탈(=앱이 뜸)을 감지한다. 포커스 이탈이 없으면 미설치로
// 간주하고 웹으로 폴백한다.

export type LaunchResult = "desktop" | "web";

const DETECT_MS = 1200;

export async function launchClaude(text: string): Promise<LaunchResult> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}

  const q = encodeURIComponent(text);
  const desktopUrl = `claude://claude.ai/new?q=${q}`;
  const webUrl = `https://claude.ai/new?q=${q}`;

  return await new Promise<LaunchResult>((resolve) => {
    let lostFocus = false;
    const onHide = () => {
      lostFocus = true;
    };
    window.addEventListener("blur", onHide);
    document.addEventListener("visibilitychange", onHide);

    const cleanup = () => {
      window.removeEventListener("blur", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };

    // 데스크톱 앱 실행 + 프롬프트 프리필 시도. 프로토콜이 등록돼 있으면 앱이 뜨며
    // 창 포커스가 이탈한다. 등록돼 있지 않으면 아무 일도 일어나지 않는다(페이지 유지).
    try {
      window.location.href = desktopUrl;
    } catch {}

    window.setTimeout(() => {
      cleanup();
      if (lostFocus || document.hidden) {
        resolve("desktop");
      } else {
        window.open(webUrl, "_blank", "noopener");
        resolve("web");
      }
    }, DETECT_MS);
  });
}
