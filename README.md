# attend-now

QR 기반 강의 출석 관리 시스템. 학생은 QR을 스캔해 이름·영어이름·전화번호를 입력하고,
선생님은 대시보드에서 강의별 출석 현황을 확인합니다.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- Supabase (PostgreSQL)

## 실행

```bash
npm install
npm run dev
```

실행 전에 프로젝트 루트에 `.env.local` 을 만들고 아래 3개를 채워야 동작합니다.
(`.env.local` 은 gitignore 대상이라 저장소에 올라가지 않습니다.)

| 변수 | 설명 |
| --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 Settings → API 의 Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 `service_role` 키 — **서버 전용, 절대 공개 금지** |
| `TEACHER_ID` | `teachers` 테이블의 선생님 UUID (audit 컬럼에 기록) |
| `SITE_URL` | (선택) QR 에 박을 주소. 커스텀 도메인을 붙였을 때만 지정합니다. Vercel 에서는 `VERCEL_PROJECT_PRODUCTION_URL` 이 자동으로 쓰이므로 보통 비워둡니다 |

모두 `NEXT_PUBLIC_` 접두사가 없습니다. 브라우저로 나가지 않고 서버에서만 읽힙니다.

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 대시보드 — 강의별 출석 현황 |
| `/students` · `/students/[id]` | 학생 목록 / 상세 |
| `/lectures` | 강의 설정 (요일 프리셋·수업 시간) |
| `/qr` · `/qr/fullscreen` | QR 띄우기 (프로젝터용 전체화면) |
| `/attend/[lectureId]` · `/done` | 학생 출석 입력 / 완료 |

## 알아둘 점

- **모든 삭제는 소프트 딜리트** — row를 지우지 않고 `deleted_at` / `deleted_by` 를 채웁니다.
  모든 조회에 `deleted_at IS NULL` 이 붙습니다.
- **강의별 학생 목록은 `attendance_log` 기준**입니다. `students` ↔ `lectures` 수강등록 테이블이
  없어서, "그 강의에 한 번이라도 출석한 학생"이 곧 그 강의의 학생입니다.
  따라서 한 번도 출석하지 않은 학생은 목록·위험군에 나오지 않습니다.
- **강의는 요일 프리셋과 고정 횟수만 갖습니다.** 월화수목 16회, 토 4회, 일 4회, 토일 8회.
  달력 날짜를 세지 않으므로 매달 동일하고, 공휴일·휴강을 따로 등록할 필요가 없습니다.
  강의를 끝낼 때는 `active` 를 내리거나 삭제합니다.
- **출석률 = 이번달 QR 출석 건수 / `sessions_per_month`** 입니다 (100% 상한). 분모가 고정이라
  월말에 가까워질수록 채워집니다.
- **출석부의 "이번달 기록"** 은 기준 횟수만큼 칸을 그립니다. N번째 칸이 N번째 수업이고,
  그 수업에 출석했으면 초록·빠졌으면 빨강·아직 진행 전이면 회색입니다. 몇 번째 수업이 언제였는지는
  "누군가 출석한 날 = 수업이 있었던 날" 로 판단합니다.
- **학생 식별은 전화번호, 출석 기록 연결은 `students.id`** 입니다. 학생이 QR로 출석하면
  전화번호로 `students` 를 찾아 기존 row와 UUID를 재사용하고(없으면 생성), `attendance_log`
  에는 그 `student_id` 를 넣습니다. 이름이 바뀌면 `students` 를 갱신하고, 삭제됐던 학생이
  다시 출석하면 되살립니다. `attendance_log` 의 이름 컬럼은 "그날 이렇게 적었다"는 스냅샷입니다.
- **날짜는 항상 KST 기준**으로 계산합니다 (`lib/utils.ts` 의 `todayKST`). 서버가 UTC로
  돌기 때문에 그냥 `new Date()` 를 쓰면 한국 시간 오전 9시 이전에 날짜가 하루 밀립니다.
- **DB 접근은 전부 서버에서만** 합니다. `lib/supabase.ts` 는 `service_role` 키로 만들어져
  RLS 를 우회하므로, 맨 위에 `import 'server-only'` 를 두어 클라이언트 컴포넌트가 실수로
  import 하면 빌드가 깨지게 했습니다. 브라우저는 이 앱의 API Route 만 호출합니다.
  Supabase 쪽은 RLS 를 켜둔 채 정책을 두지 않아 `anon` 키로는 아무것도 읽히지 않습니다.
- **QR 주소는 서버에서 정합니다** (`lib/site-url.ts`). Vercel 에서는 배포마다 바뀌는 주소가 아니라
  운영 도메인이 박히고, 로컬 개발에서만 브라우저의 현재 origin 으로 대체됩니다. 그래서 로컬에서
  휴대폰으로 스캔해 보려면 `localhost` 가 아니라 dev 서버가 알려주는 `http://192.168.x.x:3000` 으로
  접속한 뒤 QR 을 띄워야 합니다.
- **로그인이 없습니다.** 배포하면 대시보드가 공개되므로 접근 제한을 따로 걸어야 합니다.
  (DB 는 위 방식으로 막혀 있지만, 대시보드 페이지 자체는 URL 을 아는 사람이면 볼 수 있습니다.)
