"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 보드·상세·폼이 같은 토스트를 쓴다. 2.2초 뒤 자동으로 사라진다. */
export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, show };
}

export function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--text-1)",
        color: "#fff",
        fontSize: 12.5,
        padding: "10px 16px",
        borderRadius: 20,
        opacity: message ? 1 : 0,
        transition: "opacity .2s",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {message}
    </div>
  );
}
