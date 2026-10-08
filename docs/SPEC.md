# SPEC.md — FlashFlip v2 (Flashcard MVP)

> **วิธีใช้**
> 1. วางไฟล์นี้ไว้ที่ root ของ repo และวาง `demo.html` ไว้ที่ `docs/demo.html` (ใช้เป็นต้นแบบหน้าตา)
> 2. ทำหัวข้อ 0 ให้เสร็จ (Supabase + `.env.local`)
> 3. เปิด Claude Code ที่ root ของ repo แล้ววางข้อความนี้:
>
> ```
> อ่าน SPEC.md ทั้งไฟล์ และเปิดดู docs/demo.html เป็นต้นแบบหน้าตาและ flow
> โปรเจกต์ Next.js ขึ้นโครงไว้แล้ว ให้ตรวจโครงที่มีอยู่ก่อน แล้วทำตั้งแต่ Phase 1 ถึง Phase 7 ต่อเนื่องจนเสร็จ
> ตามกติกาในหัวข้อ 1.2 หยุดถามผมเฉพาะกรณีที่ระบุไว้ในหัวข้อนั้นเท่านั้น
> ```

---

## 0. สิ่งที่คุณต้องทำเองก่อนเริ่ม (ไม่ใช่งานของ Claude Code)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) → คัดลอก Project URL และ anon/publishable key
2. สร้าง `.env.local` ที่ root
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Supabase → Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (เปลี่ยนเป็น URL ของ Vercel หลัง Deploy)
   - Redirect URLs: `http://localhost:3000/**` และ `https://<your-app>.vercel.app/**`
4. เมื่อ Claude Code แจ้งใน Phase 2 ให้นำ `supabase/migrations/0001_init.sql` ไปรันใน Supabase SQL Editor
5. ตอน Deploy: เชื่อม repo กับ Vercel และใส่ env สองตัวเดียวกัน

> อีเมล Magic Link ของ Supabase แบบค่าเริ่มต้นจำกัดจำนวนต่อชั่วโมง พอสำหรับเพื่อนไม่กี่คน

---

## 1. บทบาท เป้าหมาย และกติกาการทำงาน

### 1.1 เป้าหมาย

คุณคือ Senior Full-stack Engineer ที่ช่วยผมสร้าง **FlashFlip** เว็บฝึกจำคำศัพท์ภาษาอังกฤษสำหรับคนไทย ให้เพื่อนใช้งานจริงได้ และใช้เป็น Portfolio

ปัญหาจริงจากผู้ใช้ (ห้ามตัดสองข้อนี้):
1. **"ปัญหาที่น่าเบื่อที่สุดคือตอนต้องกรอกคำ"** → พิมพ์คำอังกฤษแค่ไม่กี่ตัวอักษรก็มีคำแนะนำให้เลือก แล้วแตะเลือกความหมายภาษาไทยจากพจนานุกรม ไม่ต้องพิมพ์ความหมายเอง
2. **"เอาคำที่ลืมมาไว้ในกอง แล้วสุ่มเล่นทุกวัน"** → หน้าแรกคือ "กองคำที่ยังจำไม่ได้" กดทีเดียวสุ่มฝึก คำที่จำได้ออกจากกอง คำที่จำไม่ได้อยู่ต่อ

### 1.2 กติกาการทำงาน (ทำต่อเนื่องจนเสร็จ)

- **ตรวจโครงที่มีอยู่ก่อนเขียนโค้ด**: อ่าน `package.json`, เวอร์ชัน Next.js / Tailwind, มี `src/` หรือไม่, มี shadcn แล้วหรือยัง แล้วปรับ path ในสเปกนี้ให้ตรงกับโครงจริง **ห้ามสร้างโปรเจกต์ใหม่ทับ**
- ทำ Phase ตามลำดับแบบต่อเนื่อง จบแต่ละ Phase ให้:
  1. รัน `npm run lint`, `npm test` (เมื่อมี test แล้ว) และ `npm run build` ให้ผ่าน
  2. `git commit` ด้วยข้อความ `phase N: <สรุปสั้น>`
  3. เขียนสรุป 3–5 บรรทัดว่าทำอะไรและทดสอบด้วยมืออย่างไร แล้ว **ทำ Phase ถัดไปต่อทันที**
- **หยุดถามผมเฉพาะกรณีเหล่านี้**:
  - ต้องการให้ผมรัน SQL หรือใส่ค่าใน `.env.local` / Supabase dashboard
  - ต้องติดตั้ง dependency ที่ไม่อยู่ในหัวข้อ 2
  - แก้ build/test/lint ไม่ผ่านหลังพยายาม 3 ครั้ง
  - ต้องเปลี่ยน schema หรือกฎใน Business Logic (หัวข้อ 4–5)
- ระหว่างรอผมทำขั้นตอน manual ให้ทำงานส่วนที่ไม่ต้องใช้ฐานข้อมูลต่อไปก่อนได้ (เช่น pure logic, test, UI component)
- ทำเฉพาะสิ่งที่อยู่ใน Scope ถ้าเห็นว่าควรเพิ่มอะไร ให้จดไว้ในส่วน "สิ่งที่จะทำต่อ" ของ README ห้ามทำเอง
- ถ้าไม่แน่ใจ API ของ Next.js, Supabase หรือ Tailwind เวอร์ชันที่ใช้ ให้ตรวจเอกสารล่าสุด ห้ามเดา
- โค้ดเป็นภาษาอังกฤษ ข้อความบน UI เป็นภาษาไทย ตามคำในสเปกนี้และใน `docs/demo.html`

---

## 2. Tech Stack และ Dependency ที่อนุญาต

| ส่วน | ใช้ |
|---|---|
| Framework | Next.js App Router + TypeScript (strict) ตามที่ขึ้นโครงไว้ |
| UI | Tailwind CSS + shadcn/ui (button, input, textarea, dialog, select, sonner) + lucide-react |
| Backend | Server Components อ่านข้อมูล, Server Actions เขียนข้อมูล |
| Database + Auth | Supabase ผ่าน `@supabase/ssr` และ `@supabase/supabase-js` (Postgres + RLS + Email Magic Link) |
| Validation | zod |
| Test | Vitest (unit test เฉพาะ pure function) |
| Font | Nunito + Noto Sans Thai Looped ผ่าน `next/font/google` |
| Deploy | Vercel |

ห้ามเพิ่ม library อื่น (เช่น date library, state management, animation library, ORM) โดยไม่ถาม

---

## 3. Scope

### ทำ
- Login/Logout ด้วย Email Magic Link
- กองคำ (ในโค้ดใช้ชื่อ `deck`, บน UI ใช้คำว่า "กอง"): สร้าง เปลี่ยนชื่อ ลบ
- **เพิ่มคำแบบพิมพ์แล้วเลือก** (autocomplete + เลือกความหมายจากพจนานุกรม + พิมพ์ความหมายเองได้)
- **วางทีละหลายคำ** เป็นทางเลือกรอง: พิมพ์แค่คำอังกฤษก็เติมความหมายจากพจนานุกรมให้
- แก้ไข/ลบคำ
- สุ่มฝึก Flashcard จากกองคำที่ยังจำไม่ได้ (ทุกกองรวมกัน หรือเฉพาะกอง)
- Leitner 0–5 นัดวันกลับมาทวน
- สรุปผลท้ายรอบ
- Responsive (mobile-first), รองรับ dark mode ตามระบบ

### ไม่ทำในรอบนี้
Quiz, กราฟ/Progress, Settings, Onboarding, Share link, Google Login, AI, ชุดคำสำเร็จรูป, CSV file upload, E2E test, Payment, ตาราง log การฝึก, ปุ่มสลับธีม

---

## 4. Database

สร้าง `supabase/migrations/0001_init.sql` ตามนี้ (แก้ได้เฉพาะ syntax error และต้องแจ้งผม)

```sql
-- ===== Tables =====
create table public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 60),
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

-- กันคำซ้ำในกองเดียวกัน (ไม่สนตัวพิมพ์เล็กใหญ่)
create unique index cards_deck_term_unique on public.cards (deck_id, lower(term));

-- ไม่มีแถว = คำใหม่ ยังอยู่ในกอง
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

-- ===== View: กองคำที่ยังจำไม่ได้ (คำใหม่ + คำที่ลืม + คำที่ถึงวันกลับมาทวน) =====
create view public.pile_cards
with (security_invoker = true) as
select c.id, c.deck_id, c.term, c.meaning,
       coalesce(rs.box, 0) as box
from public.cards c
left join public.review_states rs
  on rs.card_id = c.id and rs.user_id = c.user_id
where rs.card_id is null or rs.due_at <= now();
```

นิยามที่ใช้ทั้งแอป: **"ยังจำไม่ได้" = อยู่ใน view `pile_cards`** ส่วน **"จำได้แล้ว" = มี review_state ที่ due_at ยังไม่ถึง**

เขียน type ให้ตรงกับ schema ที่ `lib/types.ts` (เขียนเอง ไม่ต้อง gen)

---

## 5. Business Logic (pure function + unit test บังคับ)

ทุกไฟล์ในหัวข้อนี้ห้าม import Supabase, React หรือ Next.js

### 5.1 พจนานุกรม — `data/dictionary.json` + `lib/dictionary.ts`

รูปแบบข้อมูล:
```json
[
  { "t": "negotiate", "s": [ { "pos": "v", "m": ["ต่อรอง", "เจรจา"] } ] },
  { "t": "benefit",   "s": [ { "pos": "n", "m": ["ประโยชน์", "สวัสดิการ"] }, { "pos": "v", "m": ["ได้ประโยชน์"] } ] }
]
```
- `t` ตัวพิมพ์เล็ก ไม่ซ้ำ, `pos` ∈ `n | v | adj | adv | prep | conj | phr`, `m` มี 1–3 ความหมายภาษาไทยสั้น ๆ ที่ใช้จริง
- สร้างข้อมูลเริ่มต้น **ประมาณ 600 คำ**: คำที่ใช้บ่อยในชีวิตประจำวัน ซีรีส์ และงาน/TOEIC ระดับ A2–B2 รวม phrasal verb ที่พบบ่อย (pos = `phr`) ทำทีละชุดละ 100 คำเพื่อคุมคุณภาพ
- **ใส่หมายเหตุใน README ว่าข้อมูลชุดนี้สร้างโดย AI และต้องตรวจทาน** และออกแบบให้เปลี่ยนแหล่งข้อมูลได้ภายหลังโดยแก้แค่ไฟล์นี้

```ts
type Sense = { pos: string; m: string[] };
type DictEntry = { t: string; s: Sense[] };

function searchDictionary(entries: DictEntry[], query: string, limit = 6): DictEntry[]
function lookup(entries: DictEntry[], term: string): DictEntry | undefined
function defaultMeaning(entry: DictEntry): string // ความหมายทั้งหมดของ sense แรก join ด้วย ", "
```
กฎ `searchDictionary`: trim + lowercase, query ว่างคืน `[]`, คำที่ **ขึ้นต้น** ด้วย query มาก่อน (เรียงตามความยาวคำแล้วตามตัวอักษร) ตามด้วยคำที่ **มี** query อยู่ข้างใน, จำกัด `limit`

Test ขั้นต่ำ: ไฟล์ JSON ผ่าน zod schema และไม่มี `t` ซ้ำ, prefix มาก่อน contains, ไม่สนตัวพิมพ์, query ว่าง, limit, lookup ไม่เจอคืน undefined

### 5.2 Bulk Parser — `lib/parse-bulk.ts`

```ts
type ParsedLine = { term: string; meaning: string; auto: boolean }; // auto = เติมจากพจนานุกรม
type LineError  = { line: number; raw: string; reason: string };
type ParseResult = { valid: ParsedLine[]; errors: LineError[]; duplicates: string[] };

function parseBulkInput(
  text: string,
  existingTerms: string[],
  lookupMeaning: (term: string) => string | undefined
): ParseResult
```
กฎ:
- แยกบรรทัด `\r?\n` → trim → ข้ามบรรทัดว่าง, สูงสุด 500 บรรทัดที่ไม่ว่าง (เกินให้ throw ข้อความไทย)
- ถ้ามี **Tab**: คอลัมน์ 1 = term, คอลัมน์ 2 = meaning, คอลัมน์ที่เหลือทิ้ง (รองรับ Copy จาก Excel/Sheets)
- ถ้าไม่มี Tab แต่มี ` - ` หรือ ` – `: แยกที่ตัวคั่น **ตัวแรกเท่านั้น**
- ถ้าไม่มีตัวคั่นเลย: ทั้งบรรทัดคือ term แล้วเรียก `lookupMeaning` ถ้าเจอ ใช้ค่านั้นและ `auto = true` ถ้าไม่เจอ → error `"ไม่พบในพจนานุกรม ใส่ - ตามด้วยความหมายเอง"`
- error เมื่อ term หรือ meaning ว่าง, term > 100 ตัว, meaning > 300 ตัว
- ซ้ำ (trim + case-insensitive) ทั้งใน input และกับ `existingTerms` → ใส่ `duplicates` (เก็บตัวแรกใน input)
- `line` คือเลขบรรทัดจริงเริ่มที่ 1 (นับบรรทัดว่างด้วย)

Test ขั้นต่ำ: Tab, ` - `, meaning มี ` - ` ซ้อน, หลายคอลัมน์, คำเดี่ยวที่เจอในพจนานุกรม (auto), คำเดี่ยวที่ไม่เจอ, บรรทัดว่าง, term ว่าง, ยาวเกิน, ซ้ำใน input, ซ้ำกับของเดิม, ตัวพิมพ์ต่างกัน, CRLF, เกิน 500 บรรทัด

### 5.3 Leitner — `lib/leitner.ts`

```ts
const INTERVAL_DAYS = [1, 2, 4, 7, 14] as const; // box 1..5
const BANGKOK_OFFSET_MINUTES = 7 * 60;

function nextReviewState(
  current: { box: number },
  result: "remembered" | "forgot",
  now: Date
): { box: number; dueAt: Date }
```
- `forgot` → box 0, dueAt = now
- `remembered` → box = min(box + 1, 5), dueAt = 00:00 เวลากรุงเทพของวันนี้ + `INTERVAL_DAYS[box - 1]` วัน
- ห้ามใช้ date library

Test ขั้นต่ำ: คำใหม่จำได้ → box 1 พรุ่งนี้ 00:00 (ไทย), box 5 จำได้ → คงที่ 5 + 14 วัน, จำไม่ได้จาก box 4 → box 0 ทันที, ฝึกตอน 23:30 และ 00:30 เวลาไทยได้วันนัดถูก

### 5.4 Study Session — `lib/study-session.ts`

pure reducer ใช้กับ `useReducer`

```ts
type StudyCard = { id: string; term: string; meaning: string; box: number; deckTitle: string };
type SessionState = {
  queue: StudyCard[];   // ตัวแรกคือการ์ดปัจจุบัน
  total: number;
  leftPile: string[];   // card id ที่จำได้ตั้งแต่ครั้งแรก → ออกจากกอง
  stayed: string[];     // card id ที่เคยกดจำไม่ได้ในรอบนี้ → ยังอยู่ในกอง
  done: boolean;
};
type Action = { type: "answer"; result: "remembered" | "forgot" };

function createSession(cards: StudyCard[], random?: () => number, max = 20): SessionState
function sessionReducer(state: SessionState, action: Action): SessionState
function persistDecision(state: SessionState, cardId: string, result: "remembered" | "forgot"):
  "save-remembered" | "save-forgot" | "skip"
```
กฎ:
- `createSession`: สุ่มลำดับ (รับ `random` เพื่อให้ test ได้) จำกัด 20 ใบ
- `remembered`: เอาออกจากคิว ถ้าไม่เคยอยู่ใน `stayed` → ใส่ `leftPile`
- `forgot`: ย้ายไปท้ายคิว ใส่ `stayed` (ไม่ซ้ำ)
- คิวว่าง → `done = true`
- **`persistDecision`** (เรียกก่อน dispatch): `forgot` → `save-forgot`; `remembered` ที่ไม่เคยอยู่ใน `stayed` → `save-remembered`; `remembered` ที่เคยอยู่ใน `stayed` → `skip` (คำนี้ต้องอยู่ในกองต่อ box 0)

Test ขั้นต่ำ: จำได้หมด, จำไม่ได้แล้ววนกลับ, จำไม่ได้หลายครั้ง stayed ไม่ซ้ำ, ลืมแล้วจำได้ = skip, คิวว่างตั้งแต่ต้น, จำกัด 20 ใบ, random คงที่ได้ลำดับเดิม

---

## 6. หน้าและ Flow

ดู `docs/demo.html` ประกอบทุกหน้า ใช้ route group `(app)` ที่ตรวจ session ใน layout ถ้าไม่ login → `/login`

### `/login`
- โลโก้ FlashFlip, หัวข้อ "จำศัพท์ทีละนิด แต่จำได้จริง", คำโปรย "พิมพ์คำแล้วเลือกความหมายได้เลย แล้วฝึกเฉพาะคำที่ยังจำไม่ได้"
- ช่องอีเมล + ปุ่ม "ส่งลิงก์เข้าสู่ระบบ" → แสดง "เช็กอีเมลของคุณ กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ"
- route ยืนยัน Magic Link ตามคู่มือ `@supabase/ssr` แล้ว redirect ไป `/`

### `/` — หน้าแรก
- แถบบน: โลโก้ซ้าย, ปุ่ม "ออก" ขวา (ไอคอน + ข้อความ)
- หัวข้อ "เก่งขึ้นอีกนิดทุกวัน"
- **ช่องเพิ่มคำ** ทรงแคปซูลเต็มความกว้าง: "+ พิมพ์คำอังกฤษที่อยากจำ…" และปุ่มลูกศรวงกลมด้านขวา → `/add`
- **การ์ดกองคำ** (การ์ดซ้อน 3 ชั้น ชมพู/เหลืองด้านหลัง, มาสคอตพระอาทิตย์ลอยมุมขวาบน):
  - มีคำ: บรรทัดเล็ก = 4 คำแรกในกองคั่นด้วย " · ", หัวข้อ "กองคำที่ยังจำไม่ได้ **N** คำ", ปุ่ม "สุ่มฝึก min(N,20) คำ" → `/study`
  - ว่างแต่มีคำในระบบ: "ไม่มีคำค้างในกองแล้ว" + ปุ่ม "เพิ่มคำใหม่"
  - ยังไม่มีคำเลย: "เริ่มจากเพิ่มคำแรกที่อยากจำ" + ปุ่ม "เพิ่มคำแรก"
- **กองของฉัน**: แต่ละแถวเป็นการ์ดมีไอคอนสี (วนสีม่วง/ชมพู/เหลือง/มินต์), ชื่อกอง, จำนวนคำ, ป้าย "ยังจำไม่ได้ N" (เหลือง) หรือ "จำได้ครบ" (มินต์) → `/deck/[id]`
- ปุ่ม "สร้างกองใหม่" → ฟอร์มชื่อกองแบบ inline → สร้างแล้วไป `/add?deck=<id>`

### `/add?deck=<id>` — เพิ่มคำ (หน้าที่สำคัญที่สุด)
- แถบบน: ปุ่ม "เสร็จแล้ว" กลับหน้าก่อน
- "เพิ่มลงกอง [select]": ค่าเริ่มต้นจาก query `deck` หรือกองล่าสุด **ถ้าผู้ใช้ยังไม่มีกองเลย แสดง "กองของฉัน" และสร้างกองนี้อัตโนมัติตอนเพิ่มคำแรก** (ใน Server Action)
- **ช่องค้นหา** (combobox ตาม ARIA pattern: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, listbox) autofocus
  - พจนานุกรมโหลดฝั่ง client (dynamic import ของ JSON) แล้วค้นด้วย `searchDictionary` ทุกครั้งที่พิมพ์ ไม่เรียก server
  - รายการแนะนำสูงสุด 6 คำ: คำอังกฤษ (ส่วนที่ตรงกับที่พิมพ์เป็นตัวหนาขีดเส้นใต้) + ความหมายแรกสีจางด้านขวา
  - คีย์: ↑/↓ เลื่อน, Enter เลือก, Esc ปิด; แตะ/คลิกเลือกได้
- **เมื่อเลือกคำ**: การ์ดแสดงคำตัวใหญ่ + "แตะเลือกความหมายที่อยากจำ เลือกได้มากกว่าหนึ่ง" + ชิปความหมายแยกตามชนิดคำ (กริยา, คำนาม, คุณศัพท์ …) ชิปแรกถูกเลือกไว้ + ช่อง "หรือพิมพ์ความหมายเอง" + ปุ่ม "เพิ่ม "<คำ>" ลงกอง"
  - ความหมายที่บันทึก = ชิปที่เลือก + ข้อความที่พิมพ์เอง join ด้วย ", "
- **เมื่อไม่พบคำ** (พิมพ์ ≥ 2 ตัวและไม่มีคำแนะนำ): "ไม่พบ "<คำ>" ในพจนานุกรม พิมพ์ความหมายเองได้เลย" + ช่องความหมาย + ปุ่มเพิ่ม
- คำซ้ำในกองที่เลือก: แสดงป้ายเตือน "มี "<คำ>" ในกอง <ชื่อกอง> แล้ว" และปิดปุ่มเพิ่ม (ตรวจฝั่ง client จากรายการคำที่โหลดมา และฝั่ง server ด้วย unique index)
- Enter ในช่องค้นหาเมื่อเลือกคำแล้ว = เพิ่มคำ
- **หลังเพิ่มสำเร็จ**: toast "เพิ่ม "<คำ>" แล้ว", ล้างช่อง, focus กลับช่องค้นหา, คำขึ้นบนสุดของรายการ "เพิ่มแล้วรอบนี้ N คำ" (state ฝั่ง client)
- Server Action `addCard` validate ด้วย zod ทุกครั้ง แปลง unique violation เป็นข้อความไทย

### `/deck/[id]` — กองคำ
- ปุ่มกลับ "หน้าแรก", ชื่อกอง (แก้ได้ในที่), เมนูลบกอง (ยืนยันด้วย dialog)
- บรรทัดย่อย "ยังจำไม่ได้ X · จำได้แล้ว Y"
- ปุ่ม "เพิ่มคำลงกองนี้" → `/add?deck=<id>`
- กล่องพับได้ "มีลิสต์คำอยู่แล้ว? วางทีเดียวหลายคำ" (ปิดไว้ตั้งต้น)
  - คำอธิบาย: "บรรทัดละคำ พิมพ์แค่คำอังกฤษก็พอ ความหมายจะเติมจากพจนานุกรมให้ ถ้าอยากใส่เอง ใช้ - คั่น หรือ Copy จาก Excel / Google Sheets มาวาง"
  - ปุ่ม "ตรวจสอบ" → preview: "พร้อมเพิ่ม X คำ" พร้อมรายการ (คำที่เติมอัตโนมัติมีป้าย "เติมจากพจนานุกรม"), "มีในกองแล้ว Y คำ จะข้ามไป", รายการบรรทัดที่ผิดพร้อมเหตุผล
  - ปุ่ม "เพิ่ม X คำลงกอง" → Server Action **parse ซ้ำฝั่ง server** (ใช้ dictionary ฝั่ง server) แล้ว insert ครั้งเดียว
- รายการคำ: คำ (ตัวหนา) + ความหมาย (สีจาง) + ป้าย "ยังจำไม่ได้"/"จำได้แล้ว", แก้ไขและลบได้ในที่
- ปุ่มติดล่าง "สุ่มฝึกกองนี้ (N คำ)" → `/study?deck=<id>` ถ้า N = 0 ปุ่ม disabled และเขียน "ไม่มีคำค้างในกองนี้"
- deck ไม่ใช่ของผู้ใช้หรือไม่มีอยู่ → `notFound()`

### `/study` และ `/study?deck=<id>` — สุ่มฝึก
- ดึงจาก view `pile_cards` (กรองกองถ้ามี) join ชื่อกอง แล้ว `createSession`
- ปุ่ม "หยุดฝึก" มุมซ้ายบน, แถบความคืบหน้าหนา ไล่สีชมพู→ม่วงอ่อน, ข้อความ "เหลือ N ใบ"
- การ์ดใหญ่: ด้านหน้า = ป้ายชื่อกองด้านบน + คำ + "แตะการ์ดเพื่อดูความหมาย"; ด้านหลัง = คำเล็ก + ความหมายตัวใหญ่
- ปุ่ม "จำไม่ได้" (ชมพู, ไอคอนวนกลับ) และ "จำได้" (มินต์, ไอคอนถูก) **แสดงหลังพลิกเท่านั้น**
- คีย์ลัด Space พลิก, ← จำไม่ได้, → จำได้ (แสดงคำใบ้เฉพาะอุปกรณ์ที่มี hover) ห้ามทำงานตอน focus อยู่ในช่องพิมพ์ และ Space ตอน focus ปุ่มให้ทำงานตามปุ่มนั้น
- ตอบแต่ละครั้ง: เรียก `persistDecision` → ถ้าไม่ใช่ `skip` เรียก Server Action upsert `review_states` ด้วย `nextReviewState` (optimistic ไม่รอผล ถ้าพลาด toast "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" แต่ไม่หยุดรอบ) แล้ว dispatch; กด "จำไม่ได้" แสดง toast "เดี๋ยวคำนี้จะวนกลับมาอีกครั้ง"
- **จบรอบ**: มาสคอตพระอาทิตย์, หัวข้อ "กองเล็กลง X คำ" (ถ้า X = 0 ใช้ "ฝึกครบรอบแล้ว"), คำอธิบาย "คำที่ออกจากกองจะกลับมาให้ทวนพรุ่งนี้อีกครั้ง ถ้ายังจำได้ จะเว้นห่างขึ้นเรื่อย ๆ", การ์ดสถิติ "จำได้ ออกจากกอง" (มินต์) และ "ยังอยู่ในกอง" (ชมพู), กล่องเหลือง "ยังอยู่ในกอง พรุ่งนี้จะสุ่มเจออีก" + รายการคำ, ปุ่ม "กลับหน้าแรก" และ "สุ่มฝึกอีกรอบ"
- ไม่มีคำในกอง: มาสคอต + "กองนี้ไม่มีคำค้างแล้ว" + ปุ่ม "เพิ่มคำ" และ "กลับหน้าแรก"

---

## 7. Design System (Claymorphism พาสเทล)

ต้นแบบคือ `docs/demo.html` คัดลอก token ด้านล่างไปไว้ใน `globals.css` แล้ว map เข้ากับตัวแปรของ shadcn (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--radius`) ตามรูปแบบของ Tailwind เวอร์ชันที่ใช้

### 7.1 สี
| Token | Light | Dark | ใช้กับ |
|---|---|---|---|
| `--canvas` | `#FBF6F0` | `#1B1727` | พื้นหลังแอป (ครีม) |
| `--surface` | `#FFFFFF` | `#262036` | การ์ด ช่องกรอก |
| `--surface-2` | `#F7F2FF` | `#2E2643` | พื้นชิป ช่องรอง |
| `--ink` | `#2A2340` | `#F3EEFF` | ตัวหนังสือหลัก |
| `--muted` | `#6E6785` | `#B3A9CC` | ตัวหนังสือรอง |
| `--line` | `#ECE4F5` | `#3A3150` | เส้นแบ่ง |
| `--purple` | `#A78BFA` | `#B9A2FF` | ขอบ focus เส้นเน้น |
| `--purple-soft` / `--purple-ink` | `#EDE5FF` / `#3B2F63` | `#3A2F5C` / `#DCD0FF` | ชิปที่เลือก ป้ายชื่อกอง |
| `--pink` / `--pink-soft` / `--pink-ink` | `#FFB3C7` / `#FFE3EB` / `#8A2346` | – / `#4A2636` / `#FFC6D5` | ปุ่มจำไม่ได้ สถิติยังอยู่ในกอง |
| `--sun` / `--sun-soft` / `--sun-ink` | `#FFE59E` / `#FFF4D1` / `#7A5300` | – / `#463A1B` / `#FFE08A` | ป้ายยังจำไม่ได้ กล่องเตือน |
| `--mint` / `--mint-soft` / `--mint-ink` | `#B7E4C7` / `#E2F5E8` / `#1D5E38` | `#24503A` (ปุ่ม) / `#1F3D2B` / `#C2EDCF` | ปุ่มจำได้ ป้ายจำได้แล้ว |

**ปุ่มหลัก (primary)**: พื้น `linear-gradient(180deg, #D9CCFF, #B49BFC)` ตัวหนังสือ `#2A2340` ตัวหนา 800 **ห้ามใช้ม่วงเข้มและห้ามใช้ตัวหนังสือสีขาวบนสีพาสเทล** (contrast ไม่ผ่าน)
พื้นหลังแอปมีวงกลมไล่สีจาง ๆ (radial-gradient) สีชมพูมุมขวาบน ม่วงอ่อนซ้าย มินต์มุมขวาล่าง

### 7.2 เงาแบบดินปั้น
```css
--clay:     0 14px 28px -12px rgba(150,120,220,.22), 0 2px 4px rgba(42,35,64,.04),
            inset 0 -5px 0 rgba(42,35,64,.05), inset 0 3px 0 rgba(255,255,255,.9);
--clay-sm:  0 8px 16px -8px rgba(150,120,220,.25),
            inset 0 -3px 0 rgba(42,35,64,.06), inset 0 2px 0 rgba(255,255,255,.85);
--clay-btn: 0 10px 20px -8px rgba(167,139,250,.65),
            inset 0 -4px 0 rgba(90,60,170,.12), inset 0 2px 0 rgba(255,255,255,.7);
```
Dark mode ใช้เงาดำ `rgba(0,0,0,.6)` และ highlight `rgba(255,255,255,.06)` ตาม `docs/demo.html`

### 7.3 รูปทรงและตัวอักษร
- มุมโค้ง: ปุ่ม/ช่องค้นหา/ป้าย = `999px`, การ์ดใหญ่ 28–34px, การ์ดแถว 24px, ช่องกรอกธรรมดา 18px
- ไม่มีเส้นขอบ ใช้เงาแยกชั้นแทน ยกเว้นกล่อง "วางทีเดียวหลายคำ" ใช้เส้นประม่วงอ่อน 2px
- ฟอนต์: `Nunito` (ละติน) ต่อด้วย `Noto Sans Thai Looped` (ไทย) ใน font-family เดียวกัน น้ำหนัก 400–900
- หัวข้อ 900 + letter-spacing -0.02em, ปุ่มและป้าย 800, เนื้อหา 400–600
- ปุ่มหลักสูงอย่างน้อย 52px, ปุ่มตอบในหน้าฝึกสูง 64px, หนึ่งหน้าจอมีปุ่มหลักเด่นเพียงปุ่มเดียว

### 7.4 Motion
- ปุ่มกดยุบ `translateY(2px)` 120ms
- การ์ดพลิก 3D 500ms `cubic-bezier(.34,1.4,.5,1)` (เด้งเล็กน้อย) ด้านหน้าไล่สีขาว→`--purple-soft` ด้านหลังขาว→`--mint-soft`
- มาสคอตหน้าแรกลอยขึ้นลงช้า ๆ 4 วินาที
- `prefers-reduced-motion: reduce` → ปิด animation ทั้งหมด การ์ดสลับด้านทันที

### 7.5 มาสคอต
ทำ component `components/sun-mascot.tsx` จาก SVG `<symbol id="sun">` ใน `docs/demo.html` (พระอาทิตย์ดินปั้นยิ้ม แก้มชมพู) รับ prop `size` และ `float` ใส่ `aria-hidden` ใช้ที่การ์ดกองหน้าแรก หน้าจบรอบ และ empty state ใช้ `useId()` ตั้ง id ของ gradient ไม่ให้ชนกันเมื่อมีหลายตัวในหน้าเดียว

### 7.6 Accessibility
- ตัวหนังสือทุกจุดผ่าน WCAG AA (ป้ายสีพาสเทลใช้ `*-ink` เป็นสีตัวหนังสือเสมอ)
- focus ring 3px `--purple` offset 3px ทุกองค์ประกอบที่กดได้
- การ์ด flashcard เป็น `<button>` และประกาศด้านที่แสดงผ่าน `aria-live="polite"`
- ป้ายสถานะมีข้อความเสมอ ไม่ใช้สีอย่างเดียว
- ทดสอบที่ความกว้าง 360px ต้องไม่มี horizontal scroll

### 7.7 สถานะหน้า
ทุกหน้าที่โหลดข้อมูลมี `loading.tsx` แบบ skeleton ทรงเดียวกับการ์ดจริง และ `error.tsx` ภาษาไทยพร้อมปุ่มลองใหม่ ข้อความ error จาก Server Action เป็นภาษาไทย ห้ามแสดง error ดิบจากฐานข้อมูล

---

## 8. โครงสร้างไฟล์ที่คาดหวัง (ปรับตามโครงจริง เช่นมีหรือไม่มี `src/`)

```
app/
  login/page.tsx
  auth/confirm/route.ts
  (app)/
    layout.tsx               # ตรวจ session
    page.tsx                 # หน้าแรก
    add/page.tsx  add/actions.ts
    deck/[id]/page.tsx  deck/[id]/actions.ts
    study/page.tsx  study/actions.ts
components/
  sun-mascot.tsx  flashcard.tsx  word-search.tsx  meaning-picker.tsx
  bulk-add.tsx  pile-card.tsx  deck-row.tsx
data/dictionary.json
lib/
  supabase/{client.ts,server.ts,middleware.ts}
  dictionary.ts     + dictionary.test.ts
  parse-bulk.ts     + parse-bulk.test.ts
  leitner.ts        + leitner.test.ts
  study-session.ts  + study-session.test.ts
  types.ts
supabase/migrations/0001_init.sql
docs/demo.html
middleware.ts (หรือ proxy.ts ตามเวอร์ชัน Next.js)
README.md
```

---

## 9. Phases (ทำต่อเนื่อง ตามกติกาข้อ 1.2)

**Phase 1 — ตรวจโครง + Design System**
ตรวจโครงที่มี, ติดตั้ง dependency ที่ขาดจากหัวข้อ 2, shadcn components, Vitest (`npm test`), ฟอนต์, token หัวข้อ 7 ใน `globals.css`, `sun-mascot.tsx`, ตั้ง Supabase client + middleware/proxy, หน้า `/` ชั่วคราวที่โชว์ปุ่ม การ์ด และมาสคอตตามสไตล์
✅ build ผ่าน หน้าชั่วคราวหน้าตาตรงกับ `docs/demo.html`

**Phase 2 — Database + Auth**
migration หัวข้อ 4, `types.ts`, `/login`, route ยืนยัน, ป้องกัน `(app)`, ปุ่มออก → **แจ้งให้ผมรัน SQL** แล้วทำ Phase 3 ระหว่างรอ
✅ login ด้วยอีเมลได้, logout แล้วเข้า `/` ไม่ได้

**Phase 3 — Business Logic + พจนานุกรม**
`dictionary.ts`, `parse-bulk.ts`, `leitner.ts`, `study-session.ts` พร้อม test ตามหัวข้อ 5, สร้าง `data/dictionary.json` ~600 คำ
✅ `npm test` ผ่านทั้งหมด

**Phase 4 — หน้าแรก + เพิ่มคำ**
`/` ครบทุกสถานะ, สร้างกอง, `/add` ครบตามหัวข้อ 6 รวมสร้าง "กองของฉัน" อัตโนมัติ
✅ ผู้ใช้ใหม่เพิ่ม 10 คำติดกันด้วยคีย์บอร์ดล้วน (พิมพ์ → Enter เลือก → Enter เพิ่ม) ได้ภายใน 1 นาที

**Phase 5 — กองคำ + วางหลายคำ**
`/deck/[id]` ครบ: เปลี่ยนชื่อ ลบ แก้/ลบคำ วางหลายคำพร้อม auto-fill
✅ วาง 100 บรรทัดผสม (คำเดี่ยว, มี -, จาก Sheets) แล้วเพิ่มได้ครั้งเดียวพร้อมเห็นบรรทัดผิด

**Phase 6 — สุ่มฝึก**
`/study` ครบตามหัวข้อ 6 + `study/actions.ts` upsert review_states
✅ ลืมแล้วจำได้ในรอบเดียวกัน = ยังอยู่ในกอง, จำได้ครั้งแรก = ออกจากกอง, ปิดเว็บแล้วเปิดใหม่ตัวเลขบนหน้าแรกถูกต้อง

**Phase 7 — Polish + README**
loading/error/empty ทุกหน้า, ตรวจ 360px, dark mode, reduced motion, keyboard, contrast; README: ปัญหาที่แก้ (อ้างฟีดแบ็กผู้ใช้สองข้อในหัวข้อ 1.1), ภาพรวมสถาปัตยกรรม, เหตุผลที่เลือก Supabase RLS / Leitner / พจนานุกรมฝั่ง client, หมายเหตุข้อมูลพจนานุกรม, วิธีรัน, ขั้นตอน deploy Vercel, สิ่งที่จะทำต่อ
✅ lint, test, build ผ่าน แล้วสรุปรายการตรวจหัวข้อ 10 ให้ผมพร้อมขั้นตอน deploy

---

## 10. Definition of Done

- [ ] ผู้ใช้ใหม่ login แล้วเพิ่มคำแรกได้โดยไม่ต้องสร้างกองเอง
- [ ] พิมพ์ 2–3 ตัวอักษรแล้วเลือกคำและความหมายได้ ไม่ต้องพิมพ์ความหมายเอง
- [ ] คำที่ไม่มีในพจนานุกรมพิมพ์ความหมายเองได้
- [ ] วางคำอังกฤษล้วนหลายบรรทัดแล้วความหมายเติมให้อัตโนมัติ
- [ ] หน้าแรกแสดงจำนวนคำในกองที่ยังจำไม่ได้ถูกต้อง และสุ่มฝึกได้ในคลิกเดียว
- [ ] จำได้ครั้งแรก → ออกจากกองและกลับมาทวนตามรอบ Leitner, เคยลืมในรอบนั้น → ยังอยู่ในกอง
- [ ] ผู้ใช้ A มองไม่เห็นและแก้ข้อมูลของผู้ใช้ B ไม่ได้ (RLS)
- [ ] ใช้งานที่ 360px ได้ครบ, dark mode อ่านออก, ปิด animation ได้ตามการตั้งค่าเครื่อง
- [ ] Unit test ทั้ง 4 ไฟล์ผ่าน
- [ ] Deploy บน Vercel และเพื่อนใช้งานผ่านลิงก์ได้จริง
