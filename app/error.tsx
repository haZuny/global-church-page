"use client";

import { ContentState } from "@/components/content-state/content-state";

export default function PageError({ reset }: { reset: () => void }) {
  return <main className="page-shell" style={{ padding: "8rem 0" }}><ContentState title="페이지를 불러오지 못했습니다." description="잠시 후 다시 시도해 주세요. 문제가 계속되면 교회에 문의해 주세요."/><p style={{ textAlign: "center", marginTop: "1.5rem" }}><button type="button" onClick={reset}>다시 시도</button></p></main>;
}
