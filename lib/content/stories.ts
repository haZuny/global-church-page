export type StoryBlock = { type: "note" | "quote" | "text"; text: string };
export type StoryEntry = { category: string; subtitle: string; date: string; dateTime: string; title: string; summary: string; image: string; imageWidth: number; imageHeight: number; alt: string; blocks: StoryBlock[] };

export const stories: Record<string, StoryEntry> = {
  "vision-founder": { category: "지유쓰 · 청년부", subtitle: "삶의 목적과 하나님의 뜻을 함께 묻고, 우리 안에 주신 비전을 발견해 간 3일의 기록", date: "2026. 07. 01", dateTime: "2026-07-01", title: "우리 안에 비전을 세우는 비전파운더", summary: "사진과 함께 청년부가 나눈 질문과 고백을 만나보세요.", image: "/assets/images/jiyouth-vision-founder.jpg", imageWidth: 640, imageHeight: 853, alt: "청년부 비전파운더 안내 카드와 워크북", blocks: [{ type: "note", text: "비전파운더(청년부) · 2026. 06. 26–28" }, { type: "quote", text: "삶이란, 태어나 죽기까지\n주의 뜻(vision)이\n어떻게 채워져 가는지,\n맛보며 알아가는 것" }, { type: "text", text: "이를 위해 주께서 Build up, Rise up, Level up 하시고 ‘우리’ 안에 Vision을 만드시며 ‘우리’를 통해 Vision을 세워가십니다." }, { type: "text", text: "인생은 참으로 맛있고 멋스럽구나." }] },
  "youth-vision-founder": { category: "다음 세대", subtitle: "삶의 목적과 하나님의 뜻에 관해 진지하게 공감하고 고백한 시간", date: "2026. 07. 29", dateTime: "2026-07-29", title: "청소년부 비전파운더", summary: "다음 세대가 함께 배우고 고백한 현장의 모습을 전합니다.", image: "/assets/images/jiyouth-vision-founder-youth.jpg", imageWidth: 640, imageHeight: 853, alt: "청소년부 비전파운더 안내 카드와 워크북", blocks: [{ type: "note", text: "비전파운더(청소년부) 종료" }, { type: "text", text: "주입식이나 강제 설득이 아니라 ‘삶의 목적’과 ‘하나님의 뜻’에 대한 진지한 공감과 동의가 필요했던 시간이었습니다." }, { type: "quote", text: "주께서 아이들 입술에\n근사한 고백과 결단을\n넣어 주셨으니, 되었다." }] },
  "youth-dining-room": { category: "청년대학부", subtitle: "함께 사용할 식당 공간을 손수 꾸미며 공동체의 자리를 준비한 날", date: "2024. 02. 06", dateTime: "2024-02-06", title: "청년대학부 식당 꾸미기", summary: "함께 쓰는 공간을 준비하며 나눈 협력의 시간을 전합니다.", image: "/assets/images/global-youth-dining.jpg", imageWidth: 1200, imageHeight: 1600, alt: "청년대학부가 식당 공간을 꾸미는 모습", blocks: [{ type: "text", text: "청년대학부가 함께 사용할 식당 공간을 손수 꾸몄습니다." }, { type: "text", text: "빈 공간을 함께 정리하고 필요한 자리를 하나씩 채워 가며, 앞으로 이곳에서 나눌 식사와 대화를 준비했습니다." }, { type: "note", text: "이날의 기록은 현장 사진으로 전합니다." }] },
  "youth-winter-camp": { category: "다음 세대", subtitle: "청소년부가 함께 예배하고 교제한 겨울캠프의 사진 기록", date: "2024. 02. 01", dateTime: "2024-02-01", title: "청소년부 겨울캠프", summary: "예배와 교제로 채운 겨울 한때를 사진으로 전합니다.", image: "/assets/images/global-youth-winter-camp.jpg", imageWidth: 1600, imageHeight: 1600, alt: "청소년부 겨울캠프 현장", blocks: [{ type: "text", text: "청소년부가 일상에서 잠시 벗어나 한자리에 모여 예배하고 서로를 알아가는 시간을 보냈습니다." }, { type: "text", text: "함께한 겨울캠프의 분위기와 다음 세대 공동체의 모습을 사진으로 남겼습니다." }] },
  "mens-cell-presentation": { category: "셀 공동체", subtitle: "각자의 자리에서 준비한 내용을 나누며 함께한 공동체 기록", date: "2024. 02. 01", dateTime: "2024-02-01", title: "남성 셀 발표", summary: "서로의 이야기를 듣고 격려한 셀 공동체의 모습입니다.", image: "/assets/images/global-men-cell.jpg", imageWidth: 1600, imageHeight: 1200, alt: "남성 셀 모임 발표 현장", blocks: [{ type: "text", text: "남성 셀 공동체가 한자리에 모여 각자의 자리에서 준비한 내용을 발표하고 서로의 이야기를 들었습니다." }, { type: "text", text: "함께 배우고 응원하며 교제한 이날의 모습을 사진으로 남겼습니다." }] },
};

export const storyRows = [
  ["vision-founder", stories["vision-founder"], ""],
  ["youth-dining-room", stories["youth-dining-room"], "archive-card__image--lobby archive-card__image--thumb"],
  ["youth-winter-camp", stories["youth-winter-camp"], "archive-card__image--detail"],
  ["mens-cell-presentation", stories["mens-cell-presentation"], "archive-card__image--detail"],
] as const;
