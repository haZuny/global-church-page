# 운영 서버 네트워크·도메인·HTTPS 구성

이 문서는 Linux 서버의 공인 IP나 내부 IP가 바뀌어도 방문자가 같은 도메인으로 접속할 수 있게 하는 배포 네트워크 기준입니다. 실제 배포 대상은 `globalchurch.kr`입니다.

## 결론: 선택한 방식

이 프로젝트는 **Cloudflare DNS + Cloudflare Tunnel**을 사용합니다.

```text
방문자
  → https://globalchurch.kr
  → Cloudflare DNS·HTTPS·보안 정책
  → 암호화된 Cloudflare Tunnel (서버가 외부로 먼저 연결)
  → Linux 서버의 localhost 서비스
  → Next.js / Directus / SQLite 볼륨
```

서버가 Cloudflare로 나가는 연결을 유지하므로, 공유기 포트 포워딩이나 고정 공인 IP가 필요 없습니다. 공유기의 외부 IP가 변경되어도 Tunnel이 자동으로 다시 연결되므로 도메인은 계속 같은 서비스로 연결됩니다. 서버의 사설 IP도 서비스가 `127.0.0.1`에만 바인딩되어 있으면 영향을 주지 않습니다.

## 방식 비교

| 방식 | 적합한 환경 | IP 변경 대응 | 포트 포워딩 | 이 프로젝트의 선택 |
| --- | --- | --- | --- | --- |
| 고정 공인 IP + DNS A 레코드 + Caddy | 고정 IP가 있는 VPS | 필요 없음 | VPS는 불필요, 사내망은 필요 | 대안 |
| DDNS + DNS 갱신 프로그램 + Caddy | 공인 IP가 바뀌지만 인바운드 포트를 열 수 있는 환경 | DNS 레코드를 IP 변경 때 갱신 | 필요 | 대안 |
| Cloudflare Tunnel | 가정·교회·사내망 또는 변동 IP 서버 | Tunnel이 자동 재연결 | 불필요 | **선택** |

Cloudflare Tunnel도 서버 자체가 꺼져 있거나 인터넷이 끊기면 접속할 수 없습니다. 해결하는 범위는 IP 변경·NAT·포트 포워딩 문제입니다.

## 운영 호스트명

| 호스트명 | 용도 | 공개 범위 |
| --- | --- | --- |
| `globalchurch.kr` | 방문자용 Next.js 공개 웹 | 공개 |
| `cms.globalchurch.kr` | 공개 콘텐츠 API와 이미지·문서 자산 | 공개, published 콘텐츠만 |
| `admin.globalchurch.kr` | Directus 관리자 화면 | Cloudflare Access 등으로 관리자만 |

`cms.globalchurch.kr/admin`처럼 API 호스트로 관리자 화면을 우회하지 않게, 서버의 역방향 프록시에서 `cms` 호스트의 `/admin` 경로를 차단합니다. `admin` 호스트만 관리자 화면을 프록시하고 Cloudflare Access 정책을 적용합니다.

## 최초 연결 순서

### 1. Cloudflare에 도메인 추가

1. Cloudflare 계정에서 `Add a site`를 선택하고 `globalchurch.kr`을 추가합니다.
2. Cloudflare가 제공하는 네임서버 두 개를 확인합니다.
3. 가비아 도메인 관리에서 `globalchurch.kr`의 네임서버를 두 Cloudflare 네임서버로 교체합니다.
4. Cloudflare 대시보드가 `Active`가 될 때까지 기다립니다. 이 기간에는 기존 DNS 레코드를 임의로 삭제하지 않습니다.

네임서버 변경은 도메인 전체의 DNS 관리 위치를 Cloudflare로 바꾸는 작업입니다. 향후 메일 서비스를 사용한다면 MX, SPF, DKIM 등 기존 레코드를 먼저 확인해 Cloudflare DNS에 유지합니다.

### 2. Linux 서버 기본 보호

- 서버 방화벽은 SSH 관리 포트만 허용하고, Next.js·Directus 포트는 외부에 직접 열지 않습니다.
- Docker 포트는 `127.0.0.1`에만 바인딩합니다.
- 공유기에서 80, 443, 3000, 8055 포트 포워딩을 만들지 않습니다.
- 서버의 사설 IP는 공유기 DHCP 예약으로 고정합니다. Tunnel은 로컬 루프백으로 연결하므로 사설 IP가 바뀌어도 보통 영향은 없지만, SSH 관리와 다른 내부 장비 연동을 위해 예약을 권장합니다.

### 3. Cloudflare Tunnel 생성

Cloudflare Zero Trust 대시보드에서 Named Tunnel을 만들고, Linux 서버에 `cloudflared`를 설치합니다. **Zero Trust Free 플랜도 최초 활성화 시 결제수단과 청구 프로필 입력을 요구할 수 있습니다.** Free 플랜을 선택하면 무료 범위 내에서는 청구되지 않지만, 유료 애드온이나 과금형 기능을 활성화하지 않도록 구독·청구 화면을 확인합니다. 터널 토큰은 서버의 비밀값으로만 보관합니다. 저장소·문서·채팅에 토큰을 넣지 않습니다.

터널에는 다음의 Public Hostname을 연결합니다.

| Public Hostname | Tunnel origin | 역할 |
| --- | --- | --- |
| `globalchurch.kr` | `http://127.0.0.1:3000` | Next.js 공개 웹 |
| `cms.globalchurch.kr` | `http://127.0.0.1:8080` | API·자산용 프록시 |
| `admin.globalchurch.kr` | `http://127.0.0.1:8080` | 관리자용 프록시 |

`8080`은 서버 내부 Caddy/Nginx 역방향 프록시의 예시 포트입니다. 프록시는 요청 Host에 따라 Next.js와 Directus를 구분하고, `cms`의 `/admin`을 거부합니다. Cloudflare Tunnel은 이 프록시까지만 접속하며 공인 IP로 서비스 포트를 노출하지 않습니다.

### 4. HTTPS와 관리자 접근 보호

- 방문자는 Cloudflare가 제공하는 HTTPS로 접속합니다. HTTP 요청은 HTTPS로 리다이렉트합니다.
- `admin.globalchurch.kr`에는 Cloudflare Access 애플리케이션을 만들고 승인된 관리자 이메일만 허용합니다.
- Directus 자체 로그인과 Cloudflare Access는 함께 유지합니다. Access는 입구를 보호하고, Directus 역할·정책은 로그인 뒤 할 수 있는 일을 제한합니다.
- `cms.globalchurch.kr`은 공개 읽기 API와 자산만 제공하며, Directus 공개 권한은 `published` 상태로 제한합니다.

### 5. 애플리케이션 환경 변수 전환

실제 도메인 연결 후 환경 값을 다음 기준으로 변경합니다. 비밀값은 서버의 `.env` 또는 배포 비밀 저장소에만 두고 Git에 커밋하지 않습니다.

| 변수 | 운영 값 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://globalchurch.kr` |
| `DIRECTUS_URL` | `http://127.0.0.1:8055` 또는 Docker 내부 Directus 주소 |
| `DIRECTUS_ASSETS_URL` | `https://cms.globalchurch.kr` |
| `NEXT_PUBLIC_DIRECTUS_ADMIN_URL` | `https://admin.globalchurch.kr/admin` |
| Directus `PUBLIC_URL` | `https://admin.globalchurch.kr` |
| Directus `CORS_ORIGIN` | `https://globalchurch.kr` |

실제 Docker Compose에서 Next.js와 Directus가 같은 네트워크에 있으면 `DIRECTUS_URL`은 컨테이너 서비스명으로 변경할 수 있습니다. 공개 웹 브라우저가 이미지 파일을 내려받는 주소는 반드시 `https://cms.globalchurch.kr`을 사용합니다.

## 배포 후 검증

외부 Wi-Fi와 모바일 데이터에서 각각 확인합니다.

- `https://globalchurch.kr`의 홈, 목록, 상세 화면과 이미지가 정상 표시되는가
- `https://cms.globalchurch.kr`에서 published 콘텐츠와 파일만 공개되는가
- `https://cms.globalchurch.kr/admin`이 차단되는가
- `https://admin.globalchurch.kr/admin`이 Cloudflare Access와 Directus 로그인을 모두 요구하는가
- HTTP 주소가 HTTPS로 전환되는가
- Docker 재기동, 공유기 재기동 또는 Tunnel 재연결 뒤에도 도메인이 유지되는가

## 문제 발생 시 확인 순서

1. Cloudflare 대시보드의 도메인 상태가 `Active`인지 확인합니다.
2. Tunnel 상태가 `Healthy`인지 확인합니다.
3. Linux 서버에서 `cloudflared` 서비스 로그와 Docker 컨테이너 상태를 확인합니다.
4. Tunnel origin의 `127.0.0.1:3000`, `127.0.0.1:8080`이 서버 내부에서 응답하는지 확인합니다.
5. DNS 레코드, Cloudflare Access 정책, CORS·`PUBLIC_URL` 값이 호스트명과 일치하는지 확인합니다.

## 다음 작업

Cloudflare 계정 생성과 가비아 네임서버 변경이 완료되면, Linux 서버 접속 정보와 운영체제를 확인한 뒤 Tunnel·역방향 프록시·실제 Docker Compose 구성을 적용합니다. CI/CD는 네트워크·배포 대상이 확정된 뒤 별도 이슈 #54에서 연결합니다.
