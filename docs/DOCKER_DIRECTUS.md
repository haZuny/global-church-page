# Docker 기반 Directus 로컬 개발

이 구성은 Directus를 Docker Compose로 실행하고, SQLite 데이터베이스·업로드 파일·확장 기능을 Docker 볼륨에 영속 보관합니다. 공개 웹은 계속 Directus REST API로만 콘텐츠를 조회합니다.

## 범위와 기본값

- Directus 이미지는 `11.3.5`로 고정합니다.
- 기본 포트는 `127.0.0.1:8057`이며 `.env.docker`의 `DIRECTUS_PORT`로 변경할 수 있습니다.
- 기존 로컬·운영 인스턴스와 분리된 `global-church-preview-*` 전용 볼륨을 사용합니다.
- 호스트를 `127.0.0.1`에만 바인딩하므로, 아직 도메인·리버스 프록시 없이 인터넷에 직접 노출되지 않습니다.
- 운영 도메인, HTTPS, 리버스 프록시는 실제 배포 단계에서 별도로 결정합니다.

## 최초 실행

1. Docker Desktop을 설치하고 처음 한 번 실행해 엔진을 켭니다.
2. 환경 파일을 만듭니다.

   ```bash
   cp .env.docker.example .env.docker
   openssl rand -hex 32
   ```

3. 출력한 무작위 값을 `.env.docker`의 `KEY`, `SECRET`에 각각 넣고, `ADMIN_EMAIL`, `ADMIN_PASSWORD`를 실제 안전한 값으로 바꿉니다. `.env.docker`는 Git에서 제외됩니다.
4. 컨테이너를 실행합니다.

   ```bash
   docker compose --project-name global-church-preview --env-file .env.docker up -d
   docker compose --project-name global-church-preview --env-file .env.docker ps
   ```

5. `http://127.0.0.1:8057/server/health`가 정상 응답하는지 확인한 뒤, `http://127.0.0.1:8057/admin`으로 로그인합니다.

`ADMIN_EMAIL`과 `ADMIN_PASSWORD`는 DB가 처음 생성될 때 초기 관리자 계정에 사용됩니다. 생성 후에는 Directus 관리자에서 계정을 관리합니다. 이미 수동으로 실행한 `global-church-directus-preview` 컨테이너가 있어 이름 충돌이 나면, 아래의 기존 컨테이너 전환 절차를 한 번 진행하세요.

## 데이터 영속성

| Docker 볼륨 | 내용 | 삭제하면 안 되는 이유 |
| --- | --- | --- |
| `global-church-preview-database` | 로컬 SQLite DB, 스키마, 콘텐츠, 사용자·권한 | 로컬 CMS 데이터가 사라집니다. |
| `global-church-preview-uploads` | 업로드한 이미지·PDF·영상 파일 | 로컬 게시물의 파일이 깨집니다. |
| `global-church-preview-extensions` | 설치한 Directus 확장 기능 | 확장 기능 설정·파일이 사라집니다. |

일반적인 `docker compose down`은 위 볼륨을 삭제하지 않습니다. `docker compose down -v`는 세 볼륨을 모두 삭제하므로 필요한 로컬 콘텐츠가 있으면 사용하지 마세요.

### 이미 실행 중인 미리보기 컨테이너를 Compose로 전환

기존 컨테이너가 Compose 밖에서 만들어져 이름이 충돌할 때만 실행합니다. DB와 업로드는 별도 Docker 볼륨에 있으므로 `docker rm`은 컨테이너만 제거합니다. `-v` 옵션은 붙이지 마세요.

```bash
docker stop global-church-directus-preview
docker rm global-church-directus-preview
npm run cms:docker:up
```

## 기존 로컬 데이터 전환

현재 로컬 개발 DB(`data/directus.sqlite`)와 업로드 파일(`uploads/`)은 자동으로 덮어쓰지 않습니다. 먼저 기존 서버를 유지한 상태로 Docker 컨테이너가 빈 상태에서 정상 부팅하는지 확인합니다.

실제 전환 전에는 반드시 다음을 순서대로 수행합니다.

1. Directus 관리자에서 새 콘텐츠가 올라가지 않도록 작업 시간을 정합니다.
2. `data/directus.sqlite`와 `uploads/`를 별도 안전한 위치에 복사합니다.
3. 기존 로컬 Directus를 멈춥니다.
4. Docker DB·업로드 볼륨에 기존 데이터를 복사합니다.
5. Docker Directus에서 로그인, 게시물, 이미지, 공개 API를 확인합니다.
6. Next.js의 `DIRECTUS_URL`, `DIRECTUS_ASSETS_URL`, `NEXT_PUBLIC_DIRECTUS_ADMIN_URL`을 Docker 주소로 변경합니다.

이 과정은 운영 데이터에 영향을 줄 수 있으므로, 실제 데이터 전환은 별도 백업을 확인한 뒤 진행합니다.

## 백업·복구·업데이트

배포 전과 업데이트 전에는 SQLite 파일과 업로드를 모두 보관합니다. 백업 파일은 Git에 올리지 않고 `backups/` 같은 접근 제한된 위치에 저장합니다.

```bash
mkdir -p backups
docker compose cp directus:/directus/database/directus.sqlite backups/directus.sqlite
docker compose cp directus:/directus/uploads backups/uploads
```

복구는 Directus 컨테이너를 중지한 뒤, 백업 파일을 동일 경로로 되돌리고 다시 시작합니다. 기존 데이터를 덮어쓰는 작업이므로 복구 대상과 백업 시점을 먼저 확인합니다.

이미지를 업데이트할 때는 태그를 `docker-compose.yml`에서 의도적으로 변경한 뒤, 백업과 스테이징 점검을 거쳐 적용합니다.

```bash
docker compose pull
docker compose up -d
docker compose ps
```

문제가 생기면 이전에 검증한 이미지 태그로 되돌린 뒤 `docker compose up -d`를 실행합니다.

## 운영 전 점검

- `.env.docker`의 `KEY`, `SECRET`, 관리자 비밀번호가 예시값이 아닌가
- `PUBLIC_URL`과 `CORS_ORIGIN`이 실제 공개 주소로 바뀌었는가
- 공개 역할은 `published` 콘텐츠만 읽을 수 있는가
- 관리자 URL은 공개 웹과 별도 접근 정책·HTTPS로 보호되는가
- DB와 업로드 백업을 같은 시점으로 보관했는가
