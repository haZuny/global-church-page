# Directus 로컬 개발

`.env.example`을 복사해 `.env`를 만들고 실제 로컬 값만 입력합니다. `.env`와 `data/`는 Git에 포함하지 않습니다.

```bash
npm run cms:bootstrap
npm run cms:model:apply
npm run cms:seed
npm run cms:permissions:apply
npm run cms:editor:ko
npm run cms:media:migrate
npm run cms:start
```

`cms:model:apply`는 `.env`의 관리자 계정으로 로그인해 콘텐츠 컬렉션을 생성합니다. 여러 번 실행해도 기존 필드를 중복 생성하지 않습니다.
`cms:seed`는 기존 정적 데모의 교회 이야기와 주보를 `published` 초기 데이터로 한 번만 저장합니다.
`cms:permissions:apply`는 공개 API가 `published` 상태의 콘텐츠만 읽도록 설정합니다.
`cms:editor:ko`는 Directus 관리자 화면에 컬렉션·필드의 한국어 표시명과 운영 안내를 적용합니다.
`cms:media:migrate`는 기존 데모의 대표 이미지와 주보 이미지를 Directus Files에 업로드하고 콘텐츠에 연결합니다.

초기화가 끝나면 <http://127.0.0.1:8055/admin>에서 첫 관리자 계정으로 로그인합니다. 공개 역할·정책은 데이터 이전과 함께 별도 마이그레이션으로 적용합니다. 공개 역할은 `published` 콘텐츠의 읽기만 허용해야 합니다.
