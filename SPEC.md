# SPEC.md — FlashFlip (Flashcard MVP, 1 วัน)

> **วิธีใช้:** วางไฟล์นี้ไว้ที่ root ของ repo แล้วสั่ง Claude Code ว่า
> `อ่าน SPEC.md ทั้งไฟล์ แล้วเริ่ม Phase 1 หยุดรายงานเมื่อจบแต่ละ Phase`

---

## 0. สิ่งที่คุณต้องทำเองก่อนเริ่ม (ไม่ใช่งานของ Claude Code)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) → คัดลอก Project URL และ anon/publishable key
2. สร้างไฟล์ `.env.local`
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Supabase → Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (เปลี่ยนเป็น URL ของ Vercel หลัง Deploy)
   - Redirect URLs: เพิ่มทั้ง `http://localhost:3000/**` และ `https://<your-app>.vercel.app/**`
4. หลัง Phase 2 เสร็จ: นำ SQL ใน `supabase/migrations/` ไปรันใน Supabase SQL Editor
5. เชื่อม repo กับ Vercel และใส่ env สองตัวเดียวกัน

> หมายเหตุ: อีเมล Magic Link ของ Supabase แบบค่าเริ่มต้นจำกัดจำนวนต่อชั่วโมง พอสำหรับเพื่อนไม่กี่คน ถ้าใช้จริงมากขึ้นค่อยต่อ SMTP เอง

---

## 1. บทบาทและเป้าหมาย

คุณคือ Senior Full-stack Engineer ที่ช่วยผมสร้าง MVP ของเว็บฝึกจำคำศัพท์ภาษาอังกฤษ ให้เพื่อนใช้งานจริงได้ภายใน 1 วัน และใช้เป็น Portfolio

จุดเด่นของผลิตภัณฑ์ (ห้ามตัด):
1. **เพิ่มศัพท์หลายคำง่ายกว่า Quizlet** — วางข้อความหลายบรรทัดหรือ Copy จาก Excel/Google Sheets ได้ทันที
2. **ทบทวนเฉพาะคำที่จำไม่ได้** — คำที่กด "จำไม่ได้" วนกลับมาในรอบเดียวกันจนจำได้ และระบบนัดทบทวนครั้งถัดไปให้อัตโนมัติ

หลักการทำงาน:
- ทำตาม Phase ตามลำดับ **จบแต่ละ Phase ให้หยุด สรุปสิ่งที่ทำ และบอกวิธีทดสอบด้วยมือ** ก่อนไป Phase ถัดไป
- ทำเฉพาะสิ่งที่อยู่ใน Scope ถ้าคิดว่าควรเพิ่มอะไร ให้เสนอ ห้ามทำเอง
- ห้ามติดตั้ง dependency นอกเหนือจากรายการในหัวข้อ 2 โดยไม่ถามก่อน
- โค้ดเป็นภาษาอังกฤษ ข้อความบน UI เป็นภาษาไทย

---

## 2. Tech Stack

| ส่วน | ใช้ |
|---|---|
| Framework | Next.js (เวอร์ชัน stable ล่าสุด) App Router + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui (button, input, textarea, card, dialog, sonner) |
| Backend | Server Components สำหรับอ่านข้อมูล, Server Actions สำหรับเขียนข้อมูล |
| Database + Auth | Supabase (Postgres + RLS + Email Magic Link) ผ่าน `@supabase/ssr` |
| Validation | zod |
| Test | Vitest (unit test เฉพาะ pure function) |
| Deploy | Vercel |
| Font | Noto Sans Thai ผ่าน `next/font/google` |

ตั้งค่า Supabase client ตามคู่มือทางการของ `@supabase/ssr` สำหรับ Next.js App Router ล่าสุด (browser client, server client และ middleware/proxy สำหรับ refresh session) ถ้าไม่แน่ใจ API ใดให้ตรวจเอกสารล่าสุด ห้ามเดา

---

## 3. Scope

### ทำในรอบนี้
- Login/Logout ด้วย Email Magic Link
- สร้าง แก้ไขชื่อ ลบ ชุดคำศัพท์ (deck)
- เพิ่มคำทีละคำ และ Bulk Add แบบวางข้อความ พร้อม Preview
- แก้ไข/ลบคำศัพท์
- Flashcard พลิกการ์ด + ปุ่ม จำได้ / จำไม่ได้
- ระบบ Leitner 6 ระดับ (0–5) นัดวันทบทวน
- สรุปผลท้ายรอบฝึก
- Responsive (mobile-first)

### ห้ามทำในรอบนี้
Quiz, กราฟ/หน้า Progress, Settings, Onboarding, Share Link, Google Login, AI, CSV file upload, Playwright/E2E, Payment, ตาราง study_sessions / review_logs, Dark mode toggle (รองรับตามระบบได้ถ้าไม่เพิ่มงาน)

---

## 4. Database

สร้างไฟล์ `supabase/migrations/0001_init.sql` ตามนี้ (ปรับได้เฉพาะเมื่อพบ syntax error และต้องแจ้งผม)

```sql
-- ===== Tables =====
create table public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term        text not null check (char_length(term) between 1 and 100),
  meaning     text not null check (char_length(meaning) between 1 and 300),
  created_at  timestamptz not null default now()
);

-- ไม่มีแถว = คำใหม่ ยังไม่เคยฝึก (ถือว่าถึงกำหนดทบทวนแล้ว)
create table public.review_states (
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id          uuid not null references public.cards(id) on delete cascade,
  box              smallint not null default 0 check (box between 0 and 5),
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);

create index cards_deck_id_idx on public.cards(deck_id);
create index review_states_due_idx on public.review_states(user_id, due_at);

-- ===== RLS =====
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.review_states enable row level security;

create policy "decks_owner_all" on public.decks
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "cards_owner_all" on public.cards
  for all
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decks d
                where d.id = deck_id and d.user_id = (select auth.uid()))
  );

create policy "review_states_owner_all" on public.review_states
  for all
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.cards c
                where c.id = card_id and c.user_id = (select auth.uid()))
  );

-- ===== View: คำที่ถึงกำหนดทบทวน =====
create view public.due_cards
with (security_invoker = true) as
select c.id, c.deck_id, c.term, c.meaning,
       coalesce(rs.box, 0)          as box,
       coalesce(rs.due_at, c.created_at) as due_at
from public.cards c
left join public.review_states rs
  on rs.card_id = c.id and rs.user_id = c.user_id
where rs.card_id is null or rs.due_at <= now();
```

สร้าง TypeScript type ให้ตรงกับ schema ไว้ที่ `src/lib/types.ts` (เขียนเองได้ ไม่ต้องใช้ Supabase CLI gen types)

---

## 5. Business Logic (pure function + unit test บังคับ)

### 5.1 Bulk Add Parser — `src/lib/parse-bulk.ts`

```ts
type ParsedLine = { term: string; meaning: string };
type LineError  = { line: number; raw: string; reason: string };
type ParseResult = { valid: ParsedLine[]; errors: LineError[]; duplicates: ParsedLine[] };

function parseBulkInput(text: string, existingTerms?: string[]): ParseResult
```

กฎ:
- แยกบรรทัดด้วย `\r?\n` → trim → ข้ามบรรทัดว่าง
- ตัวคั่นตามลำดับความสำคัญ: **Tab** ก่อน, ถ้าไม่มีใช้ ` - ` (เว้นวรรคหน้าหลัง), ถ้าไม่มีใช้ ` – ` (en dash)
- แยกที่ **ตัวคั่นตัวแรกเท่านั้น** ส่วนที่เหลือทั้งหมดเป็น meaning (เพราะความหมายอาจมีขีดหรือจุลภาค)
- ถ้าบรรทัดเป็น Tab และมีมากกว่า 2 คอลัมน์ ใช้คอลัมน์ 1 เป็น term และคอลัมน์ 2 เป็น meaning ที่เหลือทิ้ง
- error เมื่อ: ไม่มีตัวคั่น, term หรือ meaning ว่าง, term > 100 ตัว, meaning > 300 ตัว
- คำซ้ำ (เทียบ term แบบ case-insensitive, trim) ทั้งซ้ำกันเองใน input และซ้ำกับ `existingTerms` → ใส่ใน `duplicates` ไม่ใส่ใน `valid` (เก็บตัวแรกที่เจอใน input)
- รับได้สูงสุด 500 บรรทัดที่ไม่ว่าง เกินให้ throw error ข้อความไทยที่อ่านเข้าใจ
- `line` เป็นเลขบรรทัดจริงแบบเริ่มที่ 1 (นับรวมบรรทัดว่าง) เพื่อให้ UI ชี้ได้ถูก

Test ขั้นต่ำ (`parse-bulk.test.ts`): Tab, ` - `, meaning ที่มี ` - ` ซ้อน, หลายคอลัมน์จาก Sheets, บรรทัดว่าง, ไม่มีตัวคั่น, term ว่าง, เกินความยาว, ซ้ำใน input, ซ้ำกับของเดิม, ตัวพิมพ์เล็กใหญ่, CRLF, เกิน 500 บรรทัด

### 5.2 Leitner Scheduler — `src/lib/leitner.ts`

```ts
const INTERVAL_DAYS = [1, 2, 4, 7, 14] as const; // สำหรับ box 1..5
const TIMEZONE = "Asia/Bangkok";

function nextReviewState(
  current: { box: number },
  result: "remembered" | "forgot",
  now: Date
): { box: number; dueAt: Date }
```

กฎ:
- `forgot` → box = 0, dueAt = now (ถึงกำหนดทันที)
- `remembered` → box = min(box + 1, 5), dueAt = **เริ่มต้นวัน (00:00 ตามเวลา Asia/Bangkok)** ของวันนี้ + `INTERVAL_DAYS[box - 1]` วัน
  - เหตุผล: ถ้านัด "พรุ่งนี้" ต้องขึ้นตั้งแต่เช้า ไม่ใช่รอถึงเวลาเดิมที่ฝึกวันนี้
- ห้ามใช้ library วันที่เพิ่ม ใช้ `Intl.DateTimeFormat` คำนวณ offset เอง (ไทยไม่มี DST ใช้ +07:00 คงที่ได้ แต่ให้เขียนเป็นค่าคงที่ชื่อชัดเจน)

Test ขั้นต่ำ: คำใหม่จำได้ → box 1 + 1 วัน, box 5 จำได้ → คงที่ 5 + 14 วัน, จำไม่ได้จาก box 4 → box 0 due ทันที, ฝึกตอน 23:30 และ 00:30 เวลาไทยได้วันนัดถูกต้อง

### 5.3 Study Queue — `src/lib/study-queue.ts`

pure reducer สำหรับรอบฝึก (ใช้กับ `useReducer` ฝั่ง client)

```ts
type QueueState = {
  queue: CardItem[];          // คิวที่เหลือ ตัวแรกคือการ์ดปัจจุบัน
  firstTryRemembered: string[]; // card id ที่จำได้ตั้งแต่ครั้งแรก
  neededRetry: string[];        // card id ที่เคยกดจำไม่ได้อย่างน้อยครั้งหนึ่งในรอบนี้
  done: boolean;
};
type Action = { type: "answer"; result: "remembered" | "forgot" };
```

กฎ:
- เริ่มรอบ: สุ่มลำดับการ์ดที่ถึงกำหนด จำกัด **20 ใบต่อรอบ**
- `remembered` → เอาการ์ดออกจากคิว
- `forgot` → ย้ายการ์ดไป **ท้ายคิว** และบันทึกใน `neededRetry` (ไม่ซ้ำ)
- คิวว่าง → `done = true`

Test ขั้นต่ำ: จำได้หมด, จำไม่ได้แล้ววนกลับมา, จำไม่ได้หลายรอบแล้ว neededRetry ไม่ซ้ำ, คิวว่างตั้งแต่ต้น

---

## 6. หน้าและ Flow

ใช้ route group `(app)` ที่ตรวจ session ใน layout ถ้าไม่ login ให้ redirect ไป `/login`

### `/login`
- ช่องอีเมล + ปุ่ม "ส่งลิงก์เข้าสู่ระบบ"
- ส่งแล้วแสดง "เช็กอีเมลของคุณ แล้วกดลิงก์เพื่อเข้าสู่ระบบ"
- มี route callback สำหรับยืนยัน Magic Link ตามคู่มือ `@supabase/ssr` แล้ว redirect ไป `/`

### `/` — หน้าแรก
- โลโก้ข้อความ "FlashFlip" มุมซ้ายบน และหัวข้อ "เก่งขึ้นอีกนิดทุกวัน"
- **การ์ดหลักขนาดใหญ่:** "วันนี้มี N คำรอให้ฝึก" + ปุ่ม "เริ่มฝึกเลย" → `/study` (รวมทุกชุด)
  - ถ้า N = 0: "วันนี้ทบทวนครบแล้ว เก่งมาก" และปุ่มเป็น disabled
- รายการชุดศัพท์: ชื่อชุด, จำนวนคำ, จำนวนที่ถึงกำหนด → กดเข้า `/deck/[id]`
- ปุ่ม "+ สร้างชุดใหม่" → dialog กรอกชื่อ → สร้างแล้วพาไปหน้า deck นั้นทันที
- Empty state ตอนยังไม่มีชุด: "เริ่มจากสร้างชุดคำศัพท์ชุดแรก" + ปุ่มสร้าง
- ปุ่มออกจากระบบอยู่มุมขวาบน (ไอคอน + ข้อความ)

### `/deck/[id]` — จัดการชุดศัพท์
- ชื่อชุด แก้ไขได้ในที่ (กดแล้วกลายเป็น input), เมนูลบชุด (ต้องยืนยันใน dialog)
- **กล่อง Bulk Add อยู่บนสุดของหน้า**
  - textarea placeholder:
    ```
    วางคำศัพท์ บรรทัดละ 1 คำ เช่น
    apple - แอปเปิล
    borrow - ยืม
    (Copy จาก Excel หรือ Google Sheets มาวางได้เลย)
    ```
  - ปุ่ม "ตรวจสอบ" → แสดง Preview: "พร้อมเพิ่ม X คำ", "ซ้ำ Y คำ (จะข้าม)", "มีปัญหา Z บรรทัด" พร้อมรายการบรรทัดที่ผิดและเหตุผล
  - ปุ่ม "เพิ่ม X คำ" → insert แบบ batch ใน Server Action เดียว → toast สำเร็จ → ล้าง textarea
  - Server Action ต้อง parse และ validate ซ้ำฝั่ง server เสมอ ห้ามเชื่อข้อมูลจาก client
- ฟอร์มเพิ่มทีละคำ (term + meaning) แบบพับเก็บได้ ใต้กล่อง Bulk Add
- รายการคำศัพท์ทั้งหมด: แต่ละแถวแก้ไข/ลบได้ในที่
- ปุ่มหลักติดด้านล่างบนมือถือ: "ฝึกชุดนี้ (N คำ)" → `/study?deck=[id]`
- ถ้า deck ไม่มีอยู่หรือไม่ใช่ของผู้ใช้ → `notFound()`

### `/study` และ `/study?deck=[id]`
- ดึงจาก view `due_cards` (กรองตาม deck ถ้ามี) สุ่มและจำกัด 20 ใบ
- แถบความคืบหน้าด้านบน: "เหลือ N ใบ"
- การ์ดใหญ่กลางจอ แสดง term → กดการ์ดหรือ Space เพื่อพลิกดู meaning
- ปุ่มสองปุ่มแสดง **หลังพลิกแล้วเท่านั้น**: "จำไม่ได้" (ซ้าย) และ "จำได้" (ขวา) ใช้ไอคอนคู่กับข้อความ ไม่พึ่งสีอย่างเดียว
- คีย์ลัด: Space = พลิก, ← = จำไม่ได้, → = จำได้ (แสดงคำใบ้คีย์ลัดเฉพาะจอกว้าง)
- ทุกครั้งที่ตอบ: อัปเดต UI ทันที (optimistic) และเรียก Server Action upsert `review_states` ด้วยผลจาก `nextReviewState` ถ้าบันทึกพลาดให้ toast แจ้งแต่ไม่หยุดรอบฝึก
- จบรอบ (ในหน้าเดียวกัน): "จำได้ตั้งแต่ครั้งแรก X คำ", "ต้องทบทวนซ้ำ Y คำ" แสดงรายการคำใน Y, ปุ่ม "กลับหน้าแรก"
- ถ้าไม่มีการ์ดถึงกำหนด: "ตอนนี้ไม่มีคำที่ต้องทบทวน" + ปุ่มกลับ

---

## 7. UI Guidelines

- Mobile-first ทดสอบที่ความกว้าง 360px ต้องไม่มี horizontal scroll หรือปุ่มล้น
- สีหลัก Mint ตั้งเป็น CSS variable ของ shadcn (`--primary`) เช่น `oklch(0.72 0.12 170)` ปรับให้ข้อความบนปุ่มผ่าน contrast WCAG AA
- ปุ่มหลักสูงอย่างน้อย 48px, 1 หน้าจอมีปุ่มหลักเด่นเพียง 1 ปุ่ม
- การพลิกการ์ดใช้ CSS 3D transform ~300ms และ **ปิด animation เมื่อ `prefers-reduced-motion: reduce`** (เปลี่ยนเป็น fade หรือสลับทันที)
- การ์ดต้องใช้ `button` หรือมี `role`/`aria-label` ที่ถูกต้อง และประกาศด้านที่แสดงอยู่ให้ screen reader (`aria-live="polite"`)
- ข้อความ UI ภาษาไทยเป็นกันเอง สั้น ไม่ใช้ศัพท์เทคนิค
- ทุกหน้าที่โหลดข้อมูลมี `loading.tsx` แบบ skeleton และมี `error.tsx` ที่บอกให้ลองใหม่
- ข้อความ error จาก Server Action เป็นภาษาไทยที่ผู้ใช้เข้าใจ ห้ามโชว์ error ดิบจากฐานข้อมูล

---

## 8. โครงสร้างไฟล์ที่คาดหวัง

```
src/
  app/
    login/page.tsx
    auth/confirm/route.ts        # callback ของ Magic Link
    (app)/
      layout.tsx                 # ตรวจ session
      page.tsx                   # หน้าแรก
      deck/[id]/page.tsx
      deck/[id]/actions.ts
      study/page.tsx
      study/actions.ts
  components/
    flashcard.tsx
    bulk-add.tsx
    ...
  lib/
    supabase/{client.ts,server.ts,middleware.ts}
    parse-bulk.ts   + parse-bulk.test.ts
    leitner.ts      + leitner.test.ts
    study-queue.ts  + study-queue.test.ts
    types.ts
supabase/migrations/0001_init.sql
middleware.ts (หรือ proxy.ts ตามเวอร์ชัน Next.js)
README.md
```

---

## 9. Phases (หยุดรายงานทุกครั้งที่จบ Phase)

**Phase 1 — Setup + Deploy (≈1 ชม.)**
สร้างโปรเจกต์, ติดตั้ง Tailwind/shadcn/Vitest, ตั้งฟอนต์และสี, หน้า `/` ชั่วคราว, ตั้ง Supabase client + middleware
✅ `npm run build` ผ่าน และบอกขั้นตอน deploy ขึ้น Vercel ให้ผม

**Phase 2 — Database + Auth (≈1 ชม.)**
เขียน migration ตามหัวข้อ 4, `types.ts`, หน้า login, callback, ป้องกัน route, ปุ่ม logout
✅ ผม login ด้วยอีเมลได้ และ logout แล้วเข้า `/` ไม่ได้

**Phase 3 — Logic + Unit Test (≈1 ชม.)**
เขียน `parse-bulk`, `leitner`, `study-queue` พร้อม test ตามหัวข้อ 5
✅ `npm test` ผ่านทั้งหมด

**Phase 4 — หน้าแรก + Deck + Bulk Add (≈2 ชม.)**
✅ สร้างชุด, วางศัพท์ 100 บรรทัดจาก Google Sheets แล้วเพิ่มได้ในครั้งเดียว, แก้/ลบคำได้

**Phase 5 — Study (≈2–3 ชม.)**
✅ ฝึกได้ครบรอบ, คำที่กดจำไม่ได้วนกลับมา, ปิดเว็บแล้วเปิดใหม่สถานะยังอยู่, คำที่จำได้หายจากรายการที่ต้องทบทวนวันนี้

**Phase 6 — Polish + README (≈1 ชม.)**
loading/error/empty states, ทดสอบที่ 360px, reduced motion, README ชื่อ FlashFlip ที่มี: ปัญหาที่แก้, จุดเด่น 2 ข้อ, สถาปัตยกรรม, เหตุผลที่เลือก Supabase RLS และ Leitner, วิธีรัน, สิ่งที่จะทำต่อ
✅ `npm run build`, `npm run lint`, `npm test` ผ่านทั้งหมด

---

## 10. Definition of Done

- [ ] ผู้ใช้ใหม่ login ด้วยอีเมลและสร้างชุดศัพท์ได้ภายใน 1 นาที
- [ ] วางศัพท์ 100 คำจาก Google Sheets แล้วเพิ่มได้ในครั้งเดียว พร้อมเห็นบรรทัดที่ผิด
- [ ] ฝึก Flashcard ได้ คำที่จำไม่ได้วนกลับมาจนจำได้
- [ ] ปิดเว็บแล้วกลับมา สถานะทบทวนยังอยู่และนัดวันถูกต้อง
- [ ] ผู้ใช้ A มองไม่เห็นและแก้ไขข้อมูลของผู้ใช้ B ไม่ได้ (บังคับด้วย RLS)
- [ ] ใช้งานบนมือถือ 360px ได้ครบโดยไม่มีปุ่มล้น
- [ ] Unit test ของ parser, scheduler และ queue ผ่าน
- [ ] Deploy บน Vercel และเพื่อนใช้งานผ่านลิงก์ได้จริง
