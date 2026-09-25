# Directus SQLite 데이터 모델

이 문서는 #5에서 Directus SQLite 스키마로 적용할 모델의 기준입니다. 공개 웹은 SQLite를 직접 읽지 않고 Directus API를 통해서만 `published` 콘텐츠를 조회합니다.

## 공통 규칙

- 공개 콘텐츠 컬렉션은 모두 `status`(`draft`, `published`, `archived`)와 `published_at`을 가집니다.
- `published_at`은 `published` 상태에서만 필수입니다. 목록 기본 정렬은 `published_at` 내림차순입니다.
- 공개 상세 URL은 Directus가 자동 생성하는 `id`를 사용합니다. 기존 `slug`은 이전 데이터 식별용으로만 유지하며 관리자 화면에는 노출하지 않습니다.
- 이미지 파일은 게시물 하위의 `story_media`·`bulletin_media` 관계로 저장합니다. 파일명은 관리자 목록에서 자동 표시하고, 별도 캡션·대체 텍스트 입력은 받지 않습니다.
- `archived`는 삭제가 아닌 복구 가능한 상태입니다.

### 리치 텍스트 본문 규칙 (#29)

- 이야기, 주보, 공지의 `body`와 교회정보의 긴 설명 필드는 Directus 리치 텍스트 편집기로 작성합니다.
- 관리자 화면에서는 제목, 굵게, 기울임, 밑줄, 취소선, 글자 크기·색상, 목록, 인용, 링크를 사용할 수 있습니다.
- 공개 웹은 문단, 제목, 목록, 인용, 링크와 제한된 글자 크기·색상만 안전하게 렌더링합니다. 스크립트·임의 임베드·위험한 링크는 표시하지 않습니다.
- 짧은 제목, 요약, 날짜, 상태, 분류처럼 구조화된 값은 리치 텍스트가 아닌 기존 입력 형식을 유지합니다.

### 레거시 필드 정리 원칙 (#30)

- 공개 웹과 관리자 입력 화면에서 더 이상 쓰지 않는 필드는 즉시 **숨김·선택값**으로 전환합니다. 기존 데이터와 컬럼은 삭제하지 않습니다.
- 기존 대표 이미지와 주보 파일은 `cms:legacy:media:migrate`로 하위 첨부 관계에 한 번 이관한 뒤에만 공개 웹의 참조를 제거합니다.
- 삭제는 백업, 데이터 이관 확인, 참조 코드 제거를 모두 마친 별도 작업에서만 진행합니다. 현재 숨긴 필드는 이력 보존용입니다.

## 컬렉션

### `site_settings` (singleton, 관리자 표기: 교회정보)

공개 사이트의 소개 문구와 방문 정보를 한곳에서 관리합니다. 여러 명의 교역자는 이 항목 안의 `교역자` 목록에서 추가·수정합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `church_name` | string | 예 | 교회명 |
| `english_name` | string | 아니오 | 영문 교회명 |
| `hero_title`, `hero_copy` | text | 아니오 | 첫 화면의 제목과 소개 |
| `introduction` | text | 예 | 한 문장 소개 |
| `greeting_*`, `pastor_name` | text/string | 아니오 | 환영 인사와 담임목사 이름. `greeting_body`는 리치 텍스트 본문 |
| `about_title` | text | 아니오 | 교회 소개 페이지 제목 |
| `vision_title`, `vision_intro`, `vision_*_title`, `vision_*_body` | text | 아니오 | 비전 제목·소개·세 가지 가치. 소개와 설명은 리치 텍스트 본문 |
| `denomination_*` | text/string | 아니오 | 교단·노회와 소개 문구. `denomination_detail`은 리치 텍스트 본문 |
| `address` | text | 예 | 도로명 주소 |
| `map_url` | string | 아니오 | 승인된 외부 지도 링크 |
| `phone` | string | 아니오 | 대표 연락처 |
| `transit_info` | text | 아니오 | 대중교통 안내 |
| `parking_info` | text | 아니오 | 주차 안내 |

숨김 이력 필드: `about_body`, `about_body_secondary`, `region`, `vision_statement`, `ministers_intro`, `visit_notice`. 현재 화면과 관리 양식에서는 사용하지 않습니다.

### `church_ministers`

`교회정보` 안에서 관리하는 교역자 목록입니다. 별도 콘텐츠 메뉴에는 노출하지 않습니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `site_settings` | M2O `site_settings` | 예 | 소속 교회정보 |
| `name` | string | 예 | 이름 |
| `role` | string | 예 | 역할 |
| `description` | text | 아니오 | 짧은 소개 |
| `photo` | M2O `directus_files` | 아니오 | 프로필 사진 |
| `sort` | integer | 예 | 노출 순서 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `worship_services`

방문자가 확인할 예배 이름·요일·시간을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `name` | string | 예 | 예배명 |
| `weekdays` | multiple select | 예 | 월요일~주일, 복수 선택 가능한 예배 요일 |
| `start_time` | select | 예 | 24시간제 `HH:mm`, 00:00~23:50 10분 단위 시작 시간 |
| `sort` | select | 예 | 첫 번째~스무 번째 화면 노출 순서. 같은 순위를 선택하면 저장한 항목을 우선 배치하고 나머지는 뒤로 밀립니다. |
| `status` | select | 예 | `draft` / `published` / `archived` |

숨김 이력 필드: `audience`, `weekday`, `location`, `description`.

### `stories`

교회 이야기의 대표 정보와 리치 텍스트 본문을 저장합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `title` | string | 예 | 제목 |
| `body` | text (rich text HTML) | 예 | 제목, 굵게, 기울임, 글자 크기·색상, 목록, 인용, 링크를 지원하는 본문 |
| `media` | O2M `story_media` | 아니오 | 본문에 추가하는 여러 이미지 |
| `published_at` | datetime | 조건부 | 게시일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `story_media`

이야기 본문에 포함하는 추가 사진입니다. `stories`와 `directus_files`를 각각 하나씩 참조하고 `sort` 순서대로 표시합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `story` | M2O `stories` | 예 | 소속 이야기 |
| `file` | M2O `directus_files` | 예 | 업로드 이미지 |
| `sort` | integer | 예 | 표시 순서 |

숨김 이력 필드: `stories.slug`, `subtitle`, `summary`, `category`, `cover_image*`, `cover_alt`; `story_media.alt`, `caption`.

### `sermons`

설교의 메타데이터와 외부 영상 연결을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `title` | string | 예 | 제목 |
| `summary` | text | 예 | 요약 |
| `scripture` | string | 예 | 성경 본문 |
| `preacher` | string | 예 | 설교자 |
| `sermon_date` | date | 예 | 설교일 |
| `video_file` | M2O `directus_files` | 아니오 | Directus에서 업로드하는 설교 영상 |
| `status` | select | 예 | `draft` / `published` / `archived` |

숨김 이력 필드: `slug`, `video_url`.

### `bulletins`

주보와 웹에서 읽을 핵심 안내를 관리합니다. 상세 주소는 자동 생성된 `id`를 사용하므로 `slug`은 이전 데이터 호환용 내부 필드입니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `title` | string | 예 | 제목 |
| `category` | select | 예 | `주보` / `자료` |
| `body` | text (rich text HTML) | 아니오 | 웹에서 함께 보여 줄 서식 있는 본문 안내 |
| `media` | O2M `bulletin_media` | 아니오 | 주보에 연결하는 여러 이미지·자료 |
| `published_at` | datetime | 조건부 | 발행일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `bulletin_media`

주보 하나에 여러 이미지와 자료를 연결합니다. 각 첨부 항목은 주보 편집 화면의 `첨부 파일`에서 추가합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `bulletin` | M2O `bulletins` | 예 | 소속 주보 |
| `file` | M2O `directus_files` | 예 | 업로드 파일 |
| `sort` | integer | 예 | 노출 순서 |

숨김 이력 필드: `bulletins.slug`, `summary`, `document_image_url`, `document_file`, `document_image_width`, `document_image_height`, `document_alt`; `bulletin_media.alt`, `caption`.

### `news_items`

공지 내용을 관리하는 컬렉션입니다. 행사 일정이나 장소가 필요하면 본문에 자연어로 작성합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `title` | string | 예 | 제목 |
| `body` | text (rich text HTML) | 아니오 | 제목, 굵게, 기울임, 글자 크기·색상, 목록, 인용, 링크를 지원하는 본문 |
| `published_at` | datetime | 조건부 | 게시일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

숨김 이력 필드: `slug`, `type`, `summary`, `event_starts_at`, `event_ends_at`, `location`.

## 공개 역할·정책

Directus 공개 역할에는 `site_settings`, `church_ministers`, `stories`, `story_media`, `sermons`, `bulletins`, `bulletin_media`, `news_items`, `worship_services`의 읽기만 허용합니다.

- 콘텐츠 컬렉션의 공개 읽기 필터: `status = "published"`
- `story_media`는 연결된 `story.status = "published"`일 때만 읽을 수 있게 설정합니다.
- `bulletin_media`는 연결된 `bulletin.status = "published"`일 때만 읽을 수 있게 설정합니다.
- 사용자, 역할, 정책, 관리자 설정과 `draft`·`archived` 콘텐츠는 공개 역할에 권한을 부여하지 않습니다.
- 파일은 공개 콘텐츠에서 참조되는 항목만 제공하도록 파일 접근 정책을 별도로 검증합니다.
