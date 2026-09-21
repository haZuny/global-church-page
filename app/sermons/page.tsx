import type { Metadata } from "next";

export const metadata: Metadata = { title: "설교" };

export default function SermonsPage() {
  return <div className="subpage"><main id="main-content">
    <section className="archive-hero archive-hero--sermons" aria-labelledby="sermons-title"><div className="page-shell archive-hero__inner"><div><p className="eyebrow">MESSAGES</p><h1 id="sermons-title">말씀을 듣고<br/>삶으로 이어갑니다.</h1></div><p>제목과 성경 본문을 먼저 살펴보고,<br/>지금 필요한 말씀을 천천히 들어보세요.</p></div></section>
    <section className="sermon-archive section" aria-label="설교 목록"><div className="page-shell"><div className="archive-toolbar"><nav aria-label="설교 분류"><span className="is-active">전체 설교</span></nav><span>MESSAGE ARCHIVE</span></div><article className="sermon-feature"><div className="sermon-art" aria-label="설교 영상 등록 예정"><span className="sermon-art__book">JOHN</span><span className="sermon-art__verse">15:9</span><span className="play-button" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z"/></svg></span><span className="sermon-art__caption">SAMPLE MESSAGE</span></div><div className="sermon__content"><p className="eyebrow">SAMPLE MESSAGE</p><h2>사랑 안에<br/>머무는 연습</h2><p className="sermon__summary">빠르게 답을 찾기보다 사랑 안에 오래 머무는 삶에 관해 이야기합니다.</p><dl className="sermon__info"><div><dt>말씀</dt><dd>요한복음 15:9–12</dd></div><div><dt>설교자</dt><dd>실제 정보 입력 예정</dd></div><div><dt>날짜</dt><dd>실제 정보 입력 예정</dd></div></dl><p className="sermon-status">현재 설교 영역은 레이아웃 확인용 샘플입니다. 실제 영상과 정보가 준비되면 이 자리에서 재생할 수 있습니다.</p></div></article></div></section>
  </main></div>;
}
