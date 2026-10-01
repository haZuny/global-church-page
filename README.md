# 글로벌교회 홈페이지

처음 교회를 찾는 방문자가 교회의 분위기, 예배 시간, 위치와 최근 소식을 편안하게 확인할 수 있는 홈페이지입니다.

이 문서는 다음 운영자·개발자가 로컬 개발, 콘텐츠 관리, 운영 서버 점검을 이어갈 수 있도록 필요한 정보만 정리한 인수인계 문서입니다. 제품 방향과 콘텐츠 작성 원칙은 [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)를 참고합니다.

## 운영 주소

| 구분 | 주소 | 용도 |
| --- | --- | --- |
| 공개 웹 | `https://globalchurch.kr` | 방문자용 홈페이지 |
| CMS | `https://cms.globalchurch.kr/admin` | Directus 관리자 |
| 저장소 | `https://github.com/haZuny/global-church-page` | 소스·문서·이슈 관리 |

## 기술 스택

| 영역 | 구성 |
| --- | --- |
| 공개 웹 | Next.js App Router, React, TypeScript |
| 스타일 | SCSS CSS Modules + 전역 디자인 토큰 |
| CMS | Directus 11 + SQLite |
| 파일 | Directus uploads 볼륨 |
| 컨테이너 | Docker Compose |
| 도메인 등록 | 가비아 |
| DNS·HTTPS·터널 | Cloudflare DNS + Cloudflare Tunnel |
| 운영 서버 | Ubuntu + Docker + `cloudflared` systemd 서비스 |

공개 웹은 SQLite에 직접 접근하지 않습니다. 모든 콘텐츠·파일 정보는 Directus REST API를 통해 읽습니다.

## 전체 구조

```text
방문자
  → https://globalchurch.kr
  → Cloudflare DNS · HTTPS · Tunnel
  → Ubuntu 서버의 127.0.0.1:3000
  → Next.js 컨테이너
  → Docker 내부망의 Directus:8055
  → SQLite · uploads Docker 볼륨

관리자
  → https://cms.globalchurch.kr/admin
  → Cloudflare Tunnel
  → Ubuntu 서버의 127.0.0.1:8055
  → Directus 컨테이너
```

| Cloudflare Public Hostname | 서버 origin | 설명 |
| --- | --- | --- |
| `globalchurch.kr` | `http://localhost:3000` | Next.js 공개 웹 |
| `cms.globalchurch.kr` | `http://localhost:8055` | Directus API·업로드 파일·관리자 화면 |

서버는 Cloudflare로 먼저 나가는 Tunnel 연결을 유지합니다. 따라서 공유기 포트 포워딩, 고정 공인 IP, Caddy/Nginx는 필요하지 않습니다. Docker의 3000·8055 포트는 반드시 `127.0.0.1`에만 바인딩합니다.

## 저장소 구조

```text
app/                         Next.js 공개 경로·메타데이터
components/                  재사용 UI 컴포넌트
assets/images/               로고와 공개 정적 이미지
scripts/directus/            Directus 모델·권한·목록 설정 스크립트
docs/                        기획·데이터 모델·운영 상세 문서
data/directus.sqlite         로컬 개발 SQLite DB (Git 제외)
uploads/                     로컬 개발 업로드 파일 (Git 제외)
docker-compose.yml           로컬 Docker Directus 점검용
docker-compose.production.yml 운영 Next.js + Directus 구성
```

## 로컬 개발

필수: Node.js 20 이상, npm, 로컬 Directus 또는 Docker Desktop.

```bash
npm ci
cp .env.example .env
# .env의 KEY, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD를 실제 로컬 값으로 변경
npm run cms:start
```

별도 터미널에서 공개 웹을 실행합니다.

```bash
npm run dev
```

- 공개 웹: `http://localhost:3000`
- 로컬 CMS: `http://127.0.0.1:8055/admin`

### 로컬 Docker CMS 점검

로컬 Directus와 충돌하지 않게 Docker Compose는 `8056`을 사용합니다.

```bash
cp .env.docker.example .env.docker
# KEY, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD 변경
docker compose up -d
docker compose ps
```

- Docker CMS: `http://127.0.0.1:8056/admin`
- 종료 시 데이터 볼륨을 지우지 않으려면 `docker compose down`만 사용합니다.
- `docker compose down -v`는 DB·uploads를 삭제하므로 운영 데이터에 사용하면 안 됩니다.

## 콘텐츠 모델·권한

- Directus 공개 역할은 `published` 콘텐츠만 읽을 수 있어야 합니다.
- 관리자 권한은 Cloudflare의 이메일 목록이 아니라 Directus 사용자·역할로 관리합니다. 새 관리자는 Directus에서 추가하고 역할을 부여합니다.
- 모델·관계 설정 스크립트는 `scripts/directus/`에 있습니다. 실제 운영 DB에 적용하기 전에는 백업과 로컬 점검을 먼저 합니다.

관련 문서:

- [콘텐츠 모델](docs/CONTENT_MODEL.md)
- [데이터 모델](docs/DATA_MODEL.md)
- [Directus 역할](docs/DIRECTUS_ROLES.md)
- [Directus 콘텐츠 목록](docs/DIRECTUS_CONTENT_LISTS.md)

## 운영 배포

운영 환경은 [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)의 절차를 따릅니다. 비밀값은 서버의 `.env.production`에만 두며 Git에 커밋하지 않습니다.

운영 Compose는 다음을 실행합니다.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

중요한 영속 볼륨:

| 볼륨 | 내용 |
| --- | --- |
| `global-church-production-database` | SQLite DB, CMS 모델, 콘텐츠, 사용자·권한 |
| `global-church-production-uploads` | 이미지·PDF 등 업로드 파일 |
| `global-church-production-extensions` | Directus 확장 기능 |

### 운영 점검 명령

Ubuntu 서버에서 저장소 디렉터리로 이동한 뒤 실행합니다.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 web directus
curl --fail http://127.0.0.1:3000
curl --fail http://127.0.0.1:8055/server/health
systemctl status cloudflared
```

Cloudflare Tunnel이 `active`, 두 컨테이너가 `Up`이고 위 두 HTTP 요청이 성공하면 서버 내부 구성은 정상입니다.

### 배포 브랜치 원칙

`main`은 통합 개발 기준입니다. 운영 서버에는 `main`을 직접 배포하지 않고, 검증된 커밋으로 만든 별도 release 브랜치만 반영합니다.

```text
main → release/YYYY-MM 또는 release/버전명 생성 → 검증 → 운영 서버 배포
```

현재는 수동 배포를 사용하며, release 브랜치 자동 검증·배포·롤백은 [#54 CI/CD 이슈](https://github.com/haZuny/global-church-page/issues/54)에서 구축합니다.

## 도메인·Cloudflare 운영

- 도메인 등록·갱신: 가비아
- 네임서버·DNS·HTTPS·Tunnel: Cloudflare
- 가비아에서 네임서버를 Cloudflare 값으로 설정했으므로, DNS 레코드는 가비아가 아니라 Cloudflare에서 관리합니다.
- 새 메일 서비스를 붙일 때는 Cloudflare DNS에 MX·SPF·DKIM 레코드를 함께 등록합니다.
- Tunnel 토큰, 서버 비밀번호, `.env.production`은 문서·GitHub 이슈·채팅에 기록하지 않습니다.

Cloudflare Tunnel은 서버 IP가 바뀌어도 도메인 연결을 유지하지만, 서버 자체가 꺼지거나 인터넷이 끊기면 서비스도 중단됩니다. 네트워크 세부 절차와 장애 확인 순서는 [DEPLOYMENT_NETWORK.md](docs/DEPLOYMENT_NETWORK.md)를 참고합니다.

## 백업·복구

SQLite와 uploads는 반드시 같은 시점의 세트로 백업해야 합니다. 서버 로컬에만 백업하면 서버 장애에 취약하므로, 장기적으로는 별도 저장소에도 보관해야 합니다.

- 자동 백업·보관·복구 리허설: [#57](https://github.com/haZuny/global-church-page/issues/57)
- 운영 이관·초기 백업 절차: [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)
- Docker 로컬 백업 참고: [DOCKER_DIRECTUS.md](docs/DOCKER_DIRECTUS.md)

DB 또는 uploads를 덮어쓰는 작업 전에는 컨테이너를 멈추고, 백업 파일·복구 대상·파일 소유권(Directus `node` 사용자 UID/GID 1000)을 확인합니다.

## 검증

```bash
npx tsc --noEmit
npm run build
npm run test:e2e
```

새 배포 전에는 데스크톱·모바일에서 홈, 교회 소개, 교회 이야기, 주보·소식, 이미지, 관리자 로그인, 예배 시간·위치 정보를 확인합니다.

## 운영 이슈

- [#54 CI/CD 구축](https://github.com/haZuny/global-church-page/issues/54)
- [#55 운영 서버 네트워크·도메인·HTTPS](https://github.com/haZuny/global-church-page/issues/55)
- [#57 자동 백업·복구](https://github.com/haZuny/global-church-page/issues/57)
