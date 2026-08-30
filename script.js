const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileLinks = mobileMenu?.querySelectorAll("a");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

function setMenu(open) {
  if (!menuToggle || !mobileMenu || !header) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  mobileMenu.hidden = !open;
  header.classList.toggle("is-menu-open", open);
  document.body.classList.toggle("menu-open", open);
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

mobileLinks?.forEach((link) => link.addEventListener("click", () => setMenu(false)));

window.addEventListener("resize", () => {
  if (window.innerWidth > 780) setMenu(false);
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealItems = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.08 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

const storyEntries = {
  "vision-founder": {
    publishedAt: "2026-07-01",
    category: "지유쓰 · 청년부",
    subtitle: "삶의 목적과 하나님의 뜻을 함께 묻고, 우리 안에 주신 비전을 발견해 간 3일의 기록",
    date: "2026. 07. 01",
    datetime: "2026-07-01",
    title: "우리 안에 비전을 세우는 비전파운더",
    summary: "사진과 함께 청년부가 나눈 질문과 고백을 만나보세요.",
    image: "assets/images/jiyouth-vision-founder.jpg",
    alt: "청년부 비전파운더 안내 카드와 워크북",
    blocks: [
      { type: "note", text: "비전파운더(청년부) · 2026. 06. 26–28" },
      {
        type: "quote",
        text: "삶이란, 태어나 죽기까지\n주의 뜻(vision)이\n어떻게 채워져 가는지,\n맛보며 알아가는 것",
      },
      {
        type: "text",
        text: "이를 위해 주께서 Build up, Rise up, Level up 하시고 ‘우리’ 안에 Vision을 만드시며 ‘우리’를 통해 Vision을 세워가십니다.",
      },
      { type: "text", text: "인생은 참으로 맛있고 멋스럽구나." },
    ],
  },
  "youth-vision-founder": {
    publishedAt: "2026-07-29",
    category: "다음 세대",
    subtitle: "삶의 목적과 하나님의 뜻에 관해 진지하게 공감하고 고백한 시간",
    date: "2026. 07. 29",
    datetime: "2026-07-29",
    title: "청소년부 비전파운더",
    summary: "다음 세대가 함께 배우고 고백한 현장의 모습을 전합니다.",
    image: "assets/images/jiyouth-vision-founder-youth.jpg",
    alt: "청소년부 비전파운더 안내 카드와 워크북",
    blocks: [
      { type: "note", text: "비전파운더(청소년부) 종료" },
      {
        type: "text",
        text: "주입식이나 강제 설득이 아니라 ‘삶의 목적’과 ‘하나님의 뜻’에 대한 진지한 공감과 동의가 필요했던 시간이었습니다.",
      },
      {
        type: "quote",
        text: "주께서 아이들 입술에\n근사한 고백과 결단을\n넣어 주셨으니, 되었다.",
      },
    ],
  },
  "youth-dining-room": {
    publishedAt: "2024-02-06",
    category: "청년대학부",
    subtitle: "함께 사용할 식당 공간을 손수 꾸미며 공동체의 자리를 준비한 날",
    date: "2024. 02. 06",
    datetime: "2024-02-06",
    title: "청년대학부 식당 꾸미기",
    summary: "함께 쓰는 공간을 준비하며 나눈 협력의 시간을 전합니다.",
    image: "assets/images/global-youth-dining.jpg",
    alt: "청년대학부가 식당 공간을 꾸미는 모습",
    blocks: [
      { type: "text", text: "청년대학부가 함께 사용할 식당 공간을 손수 꾸몄습니다." },
      {
        type: "text",
        text: "빈 공간을 함께 정리하고 필요한 자리를 하나씩 채워 가며, 앞으로 이곳에서 나눌 식사와 대화를 준비했습니다.",
      },
      { type: "note", text: "이날의 기록은 현장 사진으로 전합니다." },
    ],
  },
  "youth-winter-camp": {
    publishedAt: "2024-02-01",
    category: "다음 세대",
    subtitle: "청소년부가 함께 예배하고 교제한 겨울캠프의 사진 기록",
    date: "2024. 02. 01",
    datetime: "2024-02-01",
    title: "청소년부 겨울캠프",
    summary: "예배와 교제로 채운 겨울 한때를 사진으로 전합니다.",
    image: "assets/images/global-youth-winter-camp.jpg",
    alt: "청소년부 겨울캠프 현장",
    blocks: [
      {
        type: "text",
        text: "청소년부가 일상에서 잠시 벗어나 한자리에 모여 예배하고 서로를 알아가는 시간을 보냈습니다.",
      },
      {
        type: "text",
        text: "함께한 겨울캠프의 분위기와 다음 세대 공동체의 모습을 사진으로 남겼습니다.",
      },
    ],
  },
  "mens-cell-presentation": {
    publishedAt: "2024-02-01",
    category: "셀 공동체",
    subtitle: "각자의 자리에서 준비한 내용을 나누며 함께한 공동체 기록",
    date: "2024. 02. 01",
    datetime: "2024-02-01",
    title: "남성 셀 발표",
    summary: "서로의 이야기를 듣고 격려한 셀 공동체의 모습입니다.",
    image: "assets/images/global-men-cell.jpg",
    alt: "남성 셀 모임 발표 현장",
    blocks: [
      {
        type: "text",
        text: "남성 셀 공동체가 한자리에 모여 각자의 자리에서 준비한 내용을 발표하고 서로의 이야기를 들었습니다.",
      },
      { type: "text", text: "함께 배우고 응원하며 교제한 이날의 모습을 사진으로 전합니다." },
    ],
  },
};

const bulletinEntries = {
  "2026-03-15": { title: "2026년 3월 15일 글로벌교회 주보", date: "2026. 03. 15", image: "assets/bulletins/2026-03-15.jpg" },
  "2026-03-08": { title: "2026년 3월 8일 글로벌교회 주보", date: "2026. 03. 08", image: "assets/bulletins/2026-03-08.jpg" },
  "2026-03-01": { title: "2026년 3월 1일 글로벌교회 주보", date: "2026. 03. 01", image: "assets/bulletins/2026-03-01.jpg" },
  "2026-02-22": { title: "2026년 2월 22일 글로벌교회 주보", date: "2026. 02. 22", image: "assets/bulletins/2026-02-22.jpg" },
  "2026-lunar-new-year": {
    title: "2026년 설 가정예배 순서지",
    date: "2026. 02",
    category: "가정예배 자료",
    summary: "가정에서 함께 드리는 설 예배의 순서와 말씀을 확인하세요.",
    image: "assets/bulletins/2026-lunar-new-year.jpg",
  },
  "2026-02-15": { title: "2026년 2월 15일 글로벌교회 주보", date: "2026. 02. 15", image: "assets/bulletins/2026-02-15.jpg" },
  "2026-02-08": { title: "2026년 2월 8일 글로벌교회 주보", date: "2026. 02. 08", image: "assets/bulletins/2026-02-08.jpg" },
  "2026-02-01": { title: "2026년 2월 1일 글로벌교회 주보", date: "2026. 02. 01", image: "assets/bulletins/2026-02-01.jpg" },
};

function showMissingDetail(root, type) {
  const title = root.querySelector(`[data-${type}-title]`);
  const summary = root.querySelector(`[data-${type}-summary]`);
  const content = root.querySelector(type === "story" ? "[data-story-body]" : "[data-bulletin-document]");
  if (title) title.textContent = "요청한 내용을 찾을 수 없습니다";
  if (summary) summary.textContent = "목록으로 돌아가 다른 기록을 선택해 주세요.";
  if (content) {
    const link = document.createElement("a");
    link.className = "button button--dark";
    link.href = type === "story" ? "stories.html" : "news.html";
    link.textContent = type === "story" ? "교회 이야기 목록" : "주보·소식 목록";
    content.replaceChildren(link);
  }
}

const storyDetail = document.querySelector("[data-story-detail]");

if (storyDetail) {
  const entry = storyEntries[new URLSearchParams(window.location.search).get("id")];
  if (!entry) {
    showMissingDetail(storyDetail, "story");
  } else {
    const title = storyDetail.querySelector("[data-story-title]");
    const category = storyDetail.querySelector("[data-story-category]");
    const date = storyDetail.querySelector("[data-story-date]");
    const summary = storyDetail.querySelector("[data-story-summary]");
    const subtitle = storyDetail.querySelector("[data-story-subtitle]");
    const image = storyDetail.querySelector("[data-story-image]");
    const gallery = storyDetail.querySelector("[data-story-gallery]");
    const body = storyDetail.querySelector("[data-story-body]");

    title.textContent = entry.title;
    category.textContent = entry.category;
    date.textContent = entry.date;
    date.dateTime = entry.datetime;
    summary.textContent = entry.summary;
    subtitle.textContent = entry.subtitle;
    image.src = entry.image;
    image.alt = entry.alt;
    document.title = `${entry.title} — 글로벌교회`;

    (entry.gallery || []).forEach((photo) => {
      const figure = document.createElement("figure");
      const photoImage = document.createElement("img");
      photoImage.src = photo.src;
      photoImage.alt = photo.alt;
      photoImage.loading = "lazy";
      figure.append(photoImage);
      gallery.append(figure);
    });

    if (!entry.gallery?.length) gallery.hidden = true;

    entry.blocks.forEach((block) => {
      const element = document.createElement(block.type === "quote" ? "blockquote" : "p");
      element.className = `story-detail__${block.type}`;
      element.textContent = block.text;
      body.append(element);
    });
  }
}

const bulletinDetail = document.querySelector("[data-bulletin-detail]");

if (bulletinDetail) {
  const entry = bulletinEntries[new URLSearchParams(window.location.search).get("date")];
  if (!entry) {
    showMissingDetail(bulletinDetail, "bulletin");
  } else {
    const title = bulletinDetail.querySelector("[data-bulletin-title]");
    const category = bulletinDetail.querySelector("[data-bulletin-category]");
    const date = bulletinDetail.querySelector("[data-bulletin-date]");
    const summary = bulletinDetail.querySelector("[data-bulletin-summary]");
    const documentContainer = bulletinDetail.querySelector("[data-bulletin-document]");

    title.textContent = entry.title;
    category.textContent = entry.category || "주보";
    date.textContent = entry.date;
    summary.textContent = entry.summary || "예배 순서와 공동체 안내를 이 페이지에서 바로 확인하세요.";
    document.title = `${entry.title} — 글로벌교회`;

    const toolbar = document.createElement("div");
    toolbar.className = "bulletin-document__toolbar";

    const label = document.createElement("p");
    label.textContent = "주보 문서";

    const guide = document.createElement("span");
    guide.textContent = "화면을 확대해 읽어보세요";

    const page = document.createElement("div");
    page.className = "bulletin-document__page";

    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = `${entry.title} 전체 내용`;
    image.loading = "lazy";

    toolbar.append(label, guide);
    page.append(image);
    documentContainer.append(toolbar, page);
  }
}
