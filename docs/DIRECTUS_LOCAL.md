# Directus 로컬 운영 환경

공개 웹은 SQLite 파일에 직접 접근하지 않고 Directus REST API를 통해 콘텐츠를 조회합니다. SQLite 파일, 업로드 파일, 환경 변수는 Git에 포함하지 않습니다.

## 시작하기

1. Docker Desktop을 설치하고 실행합니다.
2. `directus/.env.example`을 `directus/.env`로 복사합니다.
3. `SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`을 로컬 전용 값으로 바꿉니다.
4. `directus` 디렉터리에서 `docker compose up -d`를 실행합니다.
5. <http://127.0.0.1:8055>에서 초기 관리자 계정으로 로그인합니다.

Directus는 `database/data.db`에 SQLite 데이터베이스를 만들고, `uploads`와 `extensions` 디렉터리를 영속 볼륨으로 사용합니다.

## 공개 웹 연동 원칙

- Next.js는 `NEXT_PUBLIC_DIRECTUS_URL`이 아닌 서버 전용 환경 변수 `DIRECTUS_URL`로 Directus를 호출합니다.
- 공개 역할은 `published` 상태 콘텐츠만 읽을 수 있어야 합니다.
- draft·archived 콘텐츠, 사용자 정보, 관리자 설정은 공개 API에 노출하지 않습니다.
- 실제 공개 도메인과 CORS 허용 원본은 배포 단계에서 별도로 확정합니다.

## 현재 검증 범위

이 저장소에서는 Docker CLI를 확인할 수 없어 컨테이너를 실제 기동하지 못했습니다. Docker Desktop이 준비된 환경에서 위 시작 절차와 `docker compose logs -f`로 초기화 상태를 확인합니다.
