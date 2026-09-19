# Prizm

팀원을 초대한 공유 스페이스에 각자 결과물을 올리면, AI가 자동으로 분석·비교해 하나의 시각화된 정리본(마인드맵 트리)으로 만들어주는 협업 플랫폼.

자료를 한 사람이 모을 필요가 없다. 각자 자기 것만 올리면 통합이 자동으로 일어난다. 아무도 "정리해줘"라고 요청하지 않았는데 화면이 스스로 갱신된다.

## 사전 요구사항

- Node.js 20+ (npm)
- Supabase 프로젝트 1개 (Postgres + Edge Functions + Realtime)
- Dashboard의 Project URL, anon public key
- Functions secret으로 넣을 `GEMINI_API_KEY` (시드는 키 없이 READY. 실시간 시연 1건에만 필요)

JDK, 로컬 MySQL/Postgres, Spring Boot는 필요하지 않습니다.

## 환경변수

시크릿은 커밋하지 마세요. 프론트에는 anon key만 넣습니다. Gemini 키와 service role은 프론트/`VITE_`에 넣지 마세요.

프론트 `frontend/.env`:

| 변수 | 설명 |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Dashboard > Settings > API > anon public |

Edge Functions secrets (`supabase secrets set` 또는 Dashboard > Edge Functions > Secrets):

| 변수 | 설명 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API 키 |
| `GEMINI_TAG_MODEL` | 기본값 `gemini-2.5-flash` |
| `GEMINI_EMBED_MODEL` | 기본값 `gemini-embedding-001` |
| `SIMILARITY_THRESHOLD` | 기본값 `0.75` |

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 는 호스티드 Functions에 자동으로 주입됩니다.

## Supabase 세팅

1. 새 프로젝트 생성 (또는 기존 프로젝트 사용)
2. SQL Editor에서 `supabase/migrations/20260919100000_prizm_schema.sql` 실행
3. SQL Editor에서 `supabase/seed.sql` 실행 (CAFE01 데모 스페이스)
4. Realtime이 artifacts / artifact_groups / members 를 구독하는지 Database > Publications 에서 확인
5. Functions 배포:

```powershell
supabase functions deploy prizm-api
supabase functions deploy analyze-artifact
supabase secrets set GEMINI_API_KEY=your-key
```

헬스체크:

`https://<project-ref>.supabase.co/functions/v1/prizm-api/health` → `{ "status": "ok" }`

Authorization 헤더에 anon key를 Bearer로 넣습니다.

## Frontend

```powershell
cd frontend
copy .env.example .env
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력
npm install
npm run dev
```

브라우저: http://localhost:5173

## 데모

- 참여 코드: `CAFE01`
- 메인 노트북: 시드된 트리(대기시간 그룹은 접힌 상태)를 보여 주는 화면
- 서브 노트북: `/join` 에서 다른 닉네임·전공으로 같은 코드 입장 후 `demo/live-upload.md` 업로드
- 시드 멤버 예: 민수(산업공학), 지현(컴퓨터공학), 수아(시각디자인)

시드 실행은 Gemini를 호출하지 않습니다. 실시간 분석은 시연 1건만 호출합니다.

## 시연 순서

1. 메인: 채워진 마인드맵. 전공 색 범례가 보이는지 확인
2. 대기시간 그룹 펼치기 — 공통점 / 차이점 / 비고
3. 서브에서 live-upload.md 업로드. 메인에서 요청 없이 노드가 생김
4. 분석 후 "업데이트됨"과 차이점 문구 변화
5. 새 노드 클릭 — 원문 패널

## 데모 리허설 체크리스트

- [ ] 메인 노트북: 시드 스페이스 입장, 대기시간 그룹은 접힌 상태
- [ ] 서브 노트북: 다른 member로 같은 코드 입장, live-upload.md 준비
- [ ] 메인에서 그룹 펼침 — 공통점/차이점/비고가 읽힌다
- [ ] 서브에서 업로드 — 메인에 요청 없이 노드가 생긴다
- [ ] 분석 후 배지와 차이점 문구가 바뀐다
- [ ] 새 노드 클릭 — 원문이 열린다
- [ ] 네트워크를 잠깐 꺼도 시드 트리는 이미 보인다

## 심사 대응

**Q. NotebookLM으로 되지 않나**  
A. 자료를 한 명이 다 모아야 한다. 각자 올리고 자동 통합되는 게 차이다.

**Q. GPT에 붙여넣으면 되는데**  
A. 요청해야 답하는 것과, 요청 없이 갱신되는 건 다른 경험이다.

**Q. 비슷한 협업툴 많은데**  
A. 기존 툴은 저장까지. 비교·연결을 AI가 대신하는 게 핵심이다.
