# Directus 로컬 개발

`.env.example`을 복사해 `.env`를 만들고 실제 로컬 값만 입력합니다. `.env`와 `data/`는 Git에 포함하지 않습니다.

```bash
npm run cms:bootstrap
npm run cms:start
```

초기화가 끝나면 <http://127.0.0.1:8055/admin>에서 첫 관리자 계정으로 로그인합니다. 콘텐츠 컬렉션과 공개 역할·정책은 데이터 모델 확정 후 별도 마이그레이션으로 적용합니다. 공개 역할은 `published` 콘텐츠의 읽기만 허용해야 합니다.
