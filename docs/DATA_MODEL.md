# Directus SQLite 데이터 모델

이 문서는 #5에서 Directus SQLite 스키마로 적용할 모델의 기준입니다. 공개 웹은 SQLite를 직접 읽지 않고 Directus API를 통해서만 `published` 콘텐츠를 조회합니다.

## 공통 규칙

- 공개 콘텐츠 컬렉션은 모두 `status`(`draft`, `published`, `archived`)와 `published_at`을 가집니다.
- `published_at`은 `published` 상태에서만 필수입니다. 목록 기본 정렬은 `published_at` 내림차순입니다.
- 공개 상세 URL은 Directus가 자동 생성하는 `id`를 사용합니다. 기존 `slug`은 이전 데이터 식별용으로만 유지하며 관리자 화면에는 노출하지 않습니다.
- 이미지 파일은 `directus_files` 관계로 저장하고, 화면에 노출되는 이미지에는 별도 대체 텍스트 필드를 둡니다.
- `archived`는 삭제가 아닌 복구 가능한 상태입니다.

## 컬렉션

### `site_settings` (singleton)

공개 사이트의 기본 문구와 방문 정보를 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `church_name` | string | 예 | 교회명 |
| `introduction` | text | 예 | 한 문장 소개 |
| `address` | text | 예 | 도로명 주소 |
| `map_url` | string | 아니오 | 승인된 외부 지도 링크 |
| `phone` | string | 아니오 | 대표 연락처 |
| `visit_notice` | text | 아니오 | 처음 방문 안내 요약 |

### `worship_services`

예배 대상별 시간·장소·설명을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `name` | string | 예 | 예배명 |
| `audience` | string | 예 | 대상 설명 |
| `weekday` | string | 예 | 요일 |
| `start_time` | time | 예 | 시작 시간 |
| `location` | string | 예 | 장소 |
| `description` | text | 아니오 | 처음 방문자를 위한 설명 |
| `sort` | integer | 예 | 화면 노출 순서 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `stories`

교회 이야기의 대표 정보와 본문 블록을 저장합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `slug` | string, unique | 예 | 상세 URL 키 |
| `title` | string | 예 | 제목 |
| `subtitle` | text | 예 | 소제목 |
| `summary` | text | 예 | 목록 요약 |
| `category` | select | 예 | 예배 / 공동체 / 이웃 섬김 / 다음 세대 |
| `body` | json | 예 | 문단·인용·안내 블록 배열 |
| `cover_image` | M2O `directus_files` | 예 | 대표 이미지 |
| `cover_alt` | string | 예 | 대표 이미지 대체 텍스트 |
| `published_at` | datetime | 조건부 | 게시일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `story_media`

이야기 본문에 포함하는 추가 사진입니다. `stories`와 `directus_files`를 각각 하나씩 참조하고 `sort` 순서대로 표시합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `story` | M2O `stories` | 예 | 소속 이야기 |
| `file` | M2O `directus_files` | 예 | 업로드 이미지 |
| `alt` | string | 예 | 이미지 대체 텍스트 |
| `caption` | string | 아니오 | 사진 설명 |
| `sort` | integer | 예 | 표시 순서 |

### `sermons`

설교의 메타데이터와 외부 영상 연결을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `slug` | string, unique | 예 | 상세 URL 키 |
| `title` | string | 예 | 제목 |
| `summary` | text | 예 | 요약 |
| `scripture` | string | 예 | 성경 본문 |
| `preacher` | string | 예 | 설교자 |
| `sermon_date` | date | 예 | 설교일 |
| `video_url` | string | 아니오 | 승인된 외부 영상 URL |
| `cover_image` | M2O `directus_files` | 아니오 | 썸네일 |
| `cover_alt` | string | 조건부 | 썸네일 대체 텍스트 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `bulletins`

주보 문서와 웹에서 읽을 핵심 일정을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `slug` | string, unique | 예 | 상세 URL 키 |
| `title` | string | 예 | 제목 |
| `summary` | text | 예 | 웹용 핵심 일정 요약 |
| `document` | M2O `directus_files` | 예 | 주보 문서 또는 이미지 |
| `document_alt` | string | 예 | 문서 대체 텍스트 |
| `published_at` | datetime | 조건부 | 발행일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `news_items`

공지와 행사를 같은 목록에서 보여 주기 위한 컬렉션입니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `slug` | string, unique | 예 | 상세 URL 키 |
| `type` | select | 예 | `notice` / `event` |
| `title` | string | 예 | 제목 |
| `summary` | text | 예 | 목록 요약 |
| `body` | json | 아니오 | 본문 블록 |
| `event_starts_at` | datetime | 행사만 | 행사 시작일 |
| `event_ends_at` | datetime | 아니오 | 행사 종료일 |
| `location` | string | 아니오 | 행사 장소 |
| `cover_image` | M2O `directus_files` | 아니오 | 대표 이미지 |
| `cover_alt` | string | 조건부 | 대표 이미지 대체 텍스트 |
| `published_at` | datetime | 조건부 | 게시일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

## 공개 역할·정책

Directus 공개 역할에는 `stories`, `story_media`, `sermons`, `bulletins`, `news_items`, `worship_services`, `site_settings`의 읽기만 허용합니다.

- 콘텐츠 컬렉션의 공개 읽기 필터: `status = "published"`
- `story_media`는 연결된 `story.status = "published"`일 때만 읽을 수 있게 설정합니다.
- 사용자, 역할, 정책, 관리자 설정과 `draft`·`archived` 콘텐츠는 공개 역할에 권한을 부여하지 않습니다.
- 파일은 공개 콘텐츠에서 참조되는 항목만 제공하도록 파일 접근 정책을 별도로 검증합니다.
