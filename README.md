# attend-now

QR 기반 강의 출석 관리 시스템. 학생은 QR을 스캔해 이름·영어이름·전화번호를 입력하고,
선생님은 대시보드에서 강의별 출석 현황을 확인합니다.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- Supabase (PostgreSQL)

## 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` 에 아래 3개를 채워야 동작합니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 화면의 anon public key |
| `TEACHER_ID` | `teachers` 테이블의 선생님 UUID (audit 컬럼에 기록) |

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 대시보드 — 강의별 출석 현황 |
| `/students` · `/students/[id]` | 학생 목록 / 상세 |
| `/lectures` | 강의 설정 (요일·기간 지정) |
| `/qr` · `/qr/fullscreen` | QR 띄우기 (프로젝터용 전체화면) |
| `/attend/[lectureId]` · `/done` | 학생 출석 입력 / 완료 |

## 알아둘 점

- **모든 삭제는 소프트 딜리트** — row를 지우지 않고 `deleted_at` / `deleted_by` 를 채웁니다.
  모든 조회에 `deleted_at IS NULL` 이 붙습니다.
- **강의별 학생 목록은 `attendance_log` 기준**입니다. `students` ↔ `lectures` 수강등록 테이블이
  없어서, "그 강의에 한 번이라도 출석한 학생"이 곧 그 강의의 학생입니다.
  따라서 한 번도 출석하지 않은 학생은 목록·위험군에 나오지 않습니다.
- **출석률 분모는 오늘까지 진행된 수업일 수**입니다 (`start_date` ~ `min(오늘, end_date)`).
- **날짜는 항상 KST 기준**으로 계산합니다 (`lib/utils.ts` 의 `todayKST`). 서버가 UTC로
  돌기 때문에 그냥 `new Date()` 를 쓰면 한국 시간 오전 9시 이전에 날짜가 하루 밀립니다.
- **로그인이 없습니다.** 배포하면 대시보드가 공개되므로 접근 제한을 따로 걸어야 합니다.
