# 로컬 개발 매뉴얼

공개 웹은 Next.js 개발 서버로, 콘텐츠 API와 관리자 화면은 별도 Directus 11.3.5 Docker 인스턴스로 실행합니다. 로컬 Directus의 SQLite·업로드·확장 볼륨은 운영 데이터와 분리되어 있습니다.

## 준비물

- Node.js 22 이상, npm
- Docker Desktop 실행 상태

## 최초 설정

저장소 루트에서 의존성과 로컬 환경 파일을 준비합니다.

```bash
npm ci
cp .env.example .env
cp .env.docker.example .env.docker
```

`openssl rand -hex 32`를 두 번 실행해 서로 다른 무작위 문자열을 만들고 `.env.docker`의 `KEY`, `SECRET`에 입력합니다. `.env`와 `.env.docker`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD`는 같은 로컬 전용 계정으로 맞춥니다. 두 파일은 Git에 커밋하지 않습니다.

로컬 Directus를 시작합니다.

```bash
npm run cms:docker:up
```

기존 `global-church-preview-*` 데이터 볼륨을 재사용할 때 Compose가 볼륨이 이미 존재한다는 경고를 표시할 수 있습니다. 이 경우 기존 볼륨을 그대로 연결하므로 삭제하지 마세요.

기동 여부와 API 응답을 확인합니다.

```bash
docker compose --project-name global-church-preview --env-file .env.docker ps
curl --fail http://127.0.0.1:8057/server/health
```

관리자 화면은 <http://127.0.0.1:8057/admin>입니다. 콘텐츠를 연결한 공개 웹은 <http://localhost:3000>에서 확인합니다.

## 빈 DB 초기화

새 Directus 볼륨을 처음 만들었거나 콘텐츠 모델이 비어 있다면 관리자 계정과 같은 값을 `.env`에도 설정한 뒤 아래 초기 구성을 실행합니다. 컬렉션·필드·관계·공개 읽기 정책을 적용합니다. 운영 CMS가 아니라 로컬 인스턴스인지 먼저 확인하세요.

```bash
npm run cms:model:apply
npm run cms:media:relations
npm run cms:bulletin:relations
npm run cms:church:relations
npm run cms:content-assets:relations
npm run cms:permissions:apply
npm run cms:files:permissions
npm run cms:editor:ko
npm run cms:lists:configure
```

목록 화면에 테스트용 콘텐츠가 필요한 경우에만 샘플을 추가합니다. 샘플은 `[샘플]` 제목으로 생성됩니다.

```bash
SEED_SAMPLE_CONTENT=1 npm run cms:sample-content:seed
```

## 웹 개발 서버

Directus가 준비된 후 별도 터미널에서 실행합니다.

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. Next.js는 `.env`의 `DIRECTUS_URL`과 `DIRECTUS_ASSETS_URL`을 사용해 콘텐츠와 파일을 읽습니다. 푸터의 관리자 링크는 `NEXT_PUBLIC_DIRECTUS_ADMIN_URL`을 사용합니다.

주소 기본값은 [`config/local-development.json`](../config/local-development.json)에 모아 두었습니다. 환경별로 주소를 바꿀 때는 `.env`에서 다음 값을 변경합니다.

```dotenv
DIRECTUS_URL=http://127.0.0.1:8057
DIRECTUS_ASSETS_URL=http://127.0.0.1:8057
NEXT_PUBLIC_DIRECTUS_ADMIN_URL=http://127.0.0.1:8057/admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

CMS 포트를 바꿀 때는 `.env.docker`의 `DIRECTUS_PORT`, `PUBLIC_URL`과 `.env`의 세 Directus 주소를 모두 같은 포트로 맞춥니다.

## 재시작과 종료

```bash
npm run cms:docker:logs # 로그 확인 (Ctrl+C로 로그 보기 종료)
npm run cms:docker:down # Directus 중지, 데이터 볼륨은 보존
npm run cms:docker:up   # Directus 다시 시작
```

앱은 개발 서버 터미널에서 `Ctrl+C`로 종료합니다. CMS 데이터를 지우지 않으려면 `docker compose down -v`를 실행하지 않습니다.

## 포트 충돌

기본 포트는 웹 `3000`, CMS `8057`입니다. 포트가 이미 사용 중이면 다른 개발 서버를 임의로 종료하지 말고, `.env.docker`의 `DIRECTUS_PORT` 및 `PUBLIC_URL`과 `.env`의 Directus 주소를 같은 사용 가능한 포트로 변경합니다. 웹 포트는 `npm run dev -- --port 3001`처럼 별도로 지정할 수 있습니다.

수동으로 먼저 실행해 둔 `global-church-directus-preview` 컨테이너가 있어 Compose 시작 시 컨테이너 이름 충돌이 날 수 있습니다. Compose로 전환하는 경우에만 다음 명령을 한 번 실행합니다. 이 절차는 컨테이너만 교체하고 `global-church-preview-*` 데이터 볼륨은 보존합니다.

```bash
docker stop global-church-directus-preview
docker rm global-church-directus-preview
npm run cms:docker:up
```

## 테스트

Playwright E2E는 격리된 테스트용 Directus fixture와 별도 웹 서버를 사용하므로 개발 CMS의 콘텐츠를 변경하지 않습니다.

```bash
npm run test:e2e
npx tsc --noEmit
```

로컬 Directus의 공개 API 확인:

```bash
curl --fail 'http://127.0.0.1:8057/items/stories?limit=1'
curl --fail 'http://127.0.0.1:8057/items/news_items?limit=1'
```
