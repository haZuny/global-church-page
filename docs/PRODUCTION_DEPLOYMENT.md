# Linux 운영 배포

이 문서는 Ubuntu 서버에서 Next.js 공개 웹과 Directus를 Docker Compose로 실행하는 절차입니다. 외부 요청은 Cloudflare Tunnel만 통해 들어오며, 서버는 3000·8055 포트를 인터넷에 공개하지 않습니다.

## 구성

```text
globalchurch.kr          → Cloudflare Tunnel → 127.0.0.1:3000 → Next.js
cms.globalchurch.kr      → Cloudflare Tunnel → 127.0.0.1:8055 → Directus API·assets·admin
Next.js 컨테이너         → Docker 내부망     → Directus:8055
```

`cms.globalchurch.kr/admin`은 Directus의 사용자·역할 정책으로 보호합니다. 공개 API와 이미지는 같은 `cms` 호스트에서 제공하되, Directus 공개 역할은 `published` 콘텐츠 읽기만 허용합니다. 개인 이메일을 수동으로 관리하는 Cloudflare Access 정책은 새 관리자를 동적으로 추가하는 운영 방식과 맞지 않으므로 기본 구성에 포함하지 않습니다.

## 서버 최초 준비

1. 저장소를 서버에 복제하고, 운영용 `release` 브랜치로 전환합니다. `main`은 통합 개발 브랜치이므로 운영 서버에서 직접 배포하지 않습니다.

   ```bash
   git clone https://github.com/haZuny/global-church-page.git ~/global-church-page
   cd ~/global-church-page
   git switch release
   cp .env.production.example .env.production
   chmod 600 .env.production
   ```

2. `.env.production`에 무작위 `KEY`, `SECRET`, 실제 관리자 계정 정보를 입력합니다. 두 값은 각각 다음처럼 생성합니다.

   ```bash
   openssl rand -hex 32
   ```

3. Cloudflare Tunnel Public Hostname을 추가합니다.

   | 호스트 | 서비스 유형 | URL |
   | --- | --- | --- |
   | `globalchurch.kr` | HTTP | `localhost:3000` |
   | `cms.globalchurch.kr` | HTTP | `localhost:8055` |

## 현재 CMS 데이터 이전

초기 운영 데이터는 로컬 `data/directus.sqlite`와 `uploads/`에서 가져옵니다. 운영 컨테이너를 처음 시작하기 전에 로컬 Mac에서 복사합니다.

```bash
ssh global@14.47.28.81 'mkdir -p ~/global-church-import/uploads'
scp data/directus.sqlite global@14.47.28.81:~/global-church-import/directus.sqlite
scp -r uploads/. global@14.47.28.81:~/global-church-import/uploads/
```

서버에서 볼륨으로 옮기기 전, 빈 Directus를 한 번 생성합니다.

```bash
cd ~/global-church-page
docker compose --env-file .env.production -f docker-compose.production.yml up -d directus
docker compose --env-file .env.production -f docker-compose.production.yml down
```

그 다음 DB·업로드 볼륨을 덮어쓰기 전 백업을 만들고, import 디렉터리의 데이터를 볼륨으로 복사합니다.

```bash
mkdir -p ~/backups/global-church-initial
docker run --rm -v global-church-production-database:/target alpine tar -C /target -czf - . > ~/backups/global-church-initial/directus-database-before-import.tar.gz
docker run --rm -v global-church-production-uploads:/target alpine tar -C /target -czf - . > ~/backups/global-church-initial/directus-uploads-before-import.tar.gz
docker run --rm -v global-church-production-database:/target -v ~/global-church-import:/source:ro alpine sh -c 'rm -f /target/directus.sqlite && cp /source/directus.sqlite /target/directus.sqlite'
docker run --rm -v global-church-production-uploads:/target -v ~/global-church-import/uploads:/source:ro alpine sh -c 'cp -a /source/. /target/'
docker run --rm -v global-church-production-database:/target alpine chown -R 1000:1000 /target
docker run --rm -v global-church-production-uploads:/target alpine chown -R 1000:1000 /target
```

데이터 이전은 기존 운영 데이터를 덮어쓰는 작업입니다. 실행 전 로컬 원본과 서버 백업 파일의 존재를 확인합니다. 마지막 두 명령은 Directus 컨테이너가 사용하는 `node` 사용자(UID/GID 1000)가 SQLite 세션과 업로드 파일에 쓸 수 있게 하는 필수 단계입니다.

## 빌드·기동·검증

```bash
cd ~/global-church-page
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl --fail http://127.0.0.1:3000
curl --fail http://127.0.0.1:8055/server/health
```

컨테이너가 정상이라면 외부·모바일 네트워크에서 `https://globalchurch.kr`, `https://cms.globalchurch.kr/server/health`를 확인합니다. Directus 관리자 URL은 `https://cms.globalchurch.kr/admin`입니다.

## 자동 배포 (GitHub Actions)

운영 서버는 공인 IP를 고정하지 않아도 되므로, GitHub가 서버로 SSH 접속하는 방식은 사용하지 않습니다. Ubuntu 서버에 설치된 self-hosted runner가 GitHub에 **아웃바운드로** 연결을 유지하고, 검증된 `release` 푸시를 받으면 서버 내부에서 배포합니다.

```text
release push
  → GitHub-hosted runner: TypeScript · Next.js build · Playwright E2E 검증
  → Ubuntu self-hosted runner: Docker 이미지 로컬 빌드 · 기동 · 헬스체크
```

이미지는 현재 운영 서버에서 직접 빌드합니다. 따라서 GitHub Container Registry나 GitHub Secrets에 Directus 키·관리자 비밀번호·Cloudflare 토큰을 저장하지 않습니다. 비밀값은 `/home/global/global-church-page/.env.production`에만 둡니다.

### 서버 runner 최초 설치

GitHub 저장소의 **Settings → Actions → Runners → New self-hosted runner → Linux**에서 발급되는 설치 명령을 Ubuntu 서버의 `global` 계정으로 실행합니다. 설치 위치는 저장소 밖의 `/home/global/actions-runner`를 권장합니다.

runner에 `global-church-production` 레이블을 붙이고 서비스로 등록합니다. runner를 실행하는 계정은 Docker를 실행할 수 있어야 합니다.

```bash
sudo usermod -aG docker global
cd /home/global/actions-runner
./svc.sh install global
./svc.sh start
```

서비스 등록 뒤에는 재로그인하거나 runner 서비스를 재시작해 Docker 그룹 권한을 반영합니다. GitHub에 runner가 `Idle`로 표시되는지 확인합니다.

`release` 브랜치 푸시가 발생하면 [release-deploy.yml](../.github/workflows/release-deploy.yml)이 먼저 GitHub-hosted runner에서 검증을 수행하고, 성공한 정확한 커밋 SHA만 서버의 `/home/global/global-church-page`에 checkout합니다. 배포 스크립트는 웹과 Directus 헬스체크에 실패하면 직전 커밋을 다시 빌드·기동합니다.

## 수동 업데이트와 롤백

```bash
git pull --ff-only origin release
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

업데이트 전에는 SQLite DB와 uploads 볼륨을 같은 시점에 백업합니다. 문제가 생기면 검증된 이전 Git 커밋으로 되돌린 뒤 다시 빌드하고, 필요한 경우 해당 시점의 DB·uploads 백업을 복구합니다. 자동 배포가 설정된 뒤에도 장애 대응이나 runner 점검 시 이 수동 절차를 사용할 수 있습니다.
