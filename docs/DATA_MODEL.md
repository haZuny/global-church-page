# Directus SQLite 데이터 모델

이 문서는 #5에서 Directus SQLite 스키마로 적용할 모델의 기준입니다. 공개 웹은 SQLite를 직접 읽지 않고 Directus API를 통해서만 `published` 콘텐츠를 조회합니다.

## 공통 규칙

- 공개 콘텐츠 컬렉션은 모두 `status`(`draft`, `published`, `archived`)와 `published_at`을 가집니다.
- `published_at`은 `published` 상태에서만 필수입니다. 목록 기본 정렬은 `published_at` 내림차순입니다.
- 공개 상세 URL은 Directus가 자동 생성하는 `id`를 사용합니다. 기존 `slug`은 이전 데이터 식별용으로만 유지하며 관리자 화면에는 노출하지 않습니다.
- 이미지 파일은 `directus_files` 관계로 저장하고, 화면에 노출되는 이미지에는 별도 대체 텍스트 필드를 둡니다.
- `archived`는 삭제가 아닌 복구 가능한 상태입니다.

## 컬렉션

### `site_settings` (singleton, 관리자 표기: 교회정보)

공개 사이트의 소개 문구와 방문 정보를 한곳에서 관리합니다. 여러 명의 교역자는 이 항목 안의 `교역자` 목록에서 추가·수정합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `church_name` | string | 예 | 교회명 |
| `english_name` | string | 아니오 | 영문 교회명 |
| `hero_title`, `hero_copy` | text | 아니오 | 첫 화면의 제목과 소개 |
| `introduction` | text | 예 | 한 문장 소개 |
| `greeting_*`, `pastor_name` | text/string | 아니오 | 환영 인사와 담임목사 이름 |
| `about_*`, `region` | text/string | 아니오 | 교회 소개 본문과 지역 |
| `vision_*` | text | 아니오 | 비전 제목·소개·세 가지 가치·한 문장 |
| `denomination_*` | text/string | 아니오 | 교단·노회와 소개 문구 |
| `ministers_intro` | text | 아니오 | 교역자 소개 영역의 인삿말 |
| `address` | text | 예 | 도로명 주소 |
| `map_url` | string | 아니오 | 승인된 외부 지도 링크 |
| `phone` | string | 아니오 | 대표 연락처 |
| `transit_info` | text | 아니오 | 대중교통 안내 |
| `parking_info` | text | 아니오 | 주차 안내 |
| `visit_notice` | text | 아니오 | 처음 방문 안내 요약 |

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

예배 대상별 시간·장소·설명을 관리합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `name` | string | 예 | 예배명 |
| `audience` | string | 아니오 | 이전 데이터 호환용 내부 필드(관리자·공개 화면 비노출) |
| `weekdays` | multiple select | 예 | 월요일~주일, 복수 선택 가능한 예배 요일 |
| `weekday` | string | 아니오 | 이전 데이터 호환용 내부 필드(관리자·공개 화면 비노출) |
| `start_time` | select | 예 | 24시간제 `HH:mm`, 00:00~23:50 10분 단위 시작 시간 |
| `location` | string | 예 | 장소 |
| `description` | text | 아니오 | 처음 방문자를 위한 설명 |
| `sort` | select | 예 | 첫 번째~스무 번째 화면 노출 순서. 같은 순위를 선택하면 저장한 항목을 우선 배치하고 나머지는 뒤로 밀립니다. |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `stories`

교회 이야기의 대표 정보와 본문 블록을 저장합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | 예 | 기본 키 |
| `slug` | string, unique | 예 | 상세 URL 키 |
| `title` | string | 예 | 제목 |
| `subtitle` | text | 아니오 | 이전 데이터 호환용 내부 필드(관리자 화면 비노출) |
| `summary` | text | 예 | 목록 요약 |
| `category` | string | 아니오 | 이전 데이터 호환용 내부 필드(관리자 화면 비노출) |
| `body` | json | 예 | 문단·인용·안내 블록 배열 |
| `media` | O2M `story_media` | 아니오 | 본문에 추가하는 여러 이미지 |
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
| `video_file` | M2O `directus_files` | 아니오 | Directus에서 업로드하는 설교 영상 |
| `cover_image` | M2O `directus_files` | 아니오 | 썸네일 |
| `cover_alt` | string | 조건부 | 썸네일 대체 텍스트 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `bulletins`

주보와 웹에서 읽을 핵심 안내를 관리합니다. 상세 주소는 자동 생성된 `id`를 사용하므로 `slug`은 이전 데이터 호환용 내부 필드입니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `slug` | string | 아니오 | 이전 데이터 호환용 내부 키(관리자 화면 비노출) |
| `title` | string | 예 | 제목 |
| `category` | select | 예 | `주보` / `자료` |
| `summary` | text | 예 | 웹용 핵심 일정 요약 |
| `body` | text | 아니오 | 웹에서 함께 보여 줄 본문 안내 |
| `media` | O2M `bulletin_media` | 아니오 | 주보에 연결하는 여러 이미지·자료 |
| `published_at` | datetime | 조건부 | 발행일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

### `bulletin_media`

주보 하나에 여러 이미지와 자료를 연결합니다. 각 첨부 항목은 주보 편집 화면의 `첨부 파일`에서 추가합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `bulletin` | M2O `bulletins` | 예 | 소속 주보 |
| `file` | M2O `directus_files` | 예 | 업로드 파일 |
| `alt` | string | 아니오 | 이미지 대체 텍스트 |
| `caption` | string | 아니오 | 파일 또는 이미지 설명 |
| `sort` | integer | 예 | 노출 순서 |

### `news_items`

공지 내용을 관리하는 컬렉션입니다. 행사 일정이나 장소가 필요하면 본문에 자연어로 작성합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| `slug` | string | 아니오 | 이전 데이터 호환용 내부 키(관리자 화면 비노출) |
| `title` | string | 예 | 제목 |
| `summary` | text | 예 | 목록 요약 |
| `body` | json | 아니오 | 본문 블록 |
| `published_at` | datetime | 조건부 | 게시일 |
| `status` | select | 예 | `draft` / `published` / `archived` |

## 공개 역할·정책

Directus 공개 역할에는 `site_settings`, `church_ministers`, `stories`, `story_media`, `sermons`, `bulletins`, `news_items`, `worship_services`의 읽기만 허용합니다.

- 콘텐츠 컬렉션의 공개 읽기 필터: `status = "published"`
- `story_media`는 연결된 `story.status = "published"`일 때만 읽을 수 있게 설정합니다.
- 사용자, 역할, 정책, 관리자 설정과 `draft`·`archived` 콘텐츠는 공개 역할에 권한을 부여하지 않습니다.
- 파일은 공개 콘텐츠에서 참조되는 항목만 제공하도록 파일 접근 정책을 별도로 검증합니다.
