// Builds sample decks from src/data/dictionary.json → src/data/mock-decks.json
// Usage: npm run mock            (default seed)
//        npm run mock -- --seed 7 --random 20
// Every term appears in only one deck. Meanings use the first sense, like the app's bulk add.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? Number(args[index + 1]) : fallback;
};
const seed = option("seed", 42);
const randomCount = option("random", 30);

// Every card starts in the pile (no review state), like a fresh install.
const TOPICS = [
  {
    title: "งานและ TOEIC",
    words: ["negotiate", "postpone", "invoice", "colleague", "deadline", "reimburse", "agenda", "schedule", "budget", "meeting", "manager", "report", "project", "attend", "approve", "deposit", "warranty", "itinerary", "headquarters", "supervisor", "workload", "recruit", "vacancy", "confidential", "applicant", "interview", "salary", "promotion", "resign", "contract"],
  },
  {
    title: "อารมณ์และความรู้สึก",
    words: ["awkward", "stubborn", "jealous", "embarrassed", "anxious", "nervous", "frustrated", "grateful", "guilty", "proud", "lonely", "excited", "worried", "scared", "surprised", "upset", "bored", "curious", "confident", "disappointed", "annoyed", "ashamed", "relieved", "confused", "exhausted", "thrilled", "miserable", "satisfied", "impatient", "homesick"],
  },
  {
    title: "ศัพท์จากซีรีส์",
    words: ["betray", "gossip", "revenge", "suspicious", "pretend", "regret", "apologize", "forgive", "cheat", "hilarious", "ridiculous", "apparently", "literally", "seriously", "weird", "deserve", "admit", "deny", "secret", "rumor", "trust", "lie", "promise", "threaten", "blame", "rescue", "innocent", "villain", "dramatic"],
  },
  {
    title: "ชีวิตประจำวัน",
    words: ["cheap", "expensive", "hungry", "delicious", "crowded", "weather", "weekend", "holiday", "restaurant", "ticket", "price", "borrow", "lend", "afford", "convenient", "comfortable", "hurry", "healthy", "symptom", "prescription", "souvenir", "grocery", "laundry", "neighbor", "rent", "bill", "receipt", "breakfast", "traffic", "umbrella"],
  },
  {
    title: "Phrasal verbs ที่เจอบ่อย",
    words: ["look forward to", "come up with", "run out of", "get along with", "put up with", "give up", "find out", "turn down", "show up", "call off", "figure out", "put off", "wake up", "look for", "look after", "pick up", "hang out", "catch up", "end up", "get over", "set up", "carry out", "turn out", "sort out", "break down", "bring up", "go over", "point out", "take care of", "get rid of"],
  },
  {
    title: "การเดินทาง",
    words: ["airport", "passport", "luggage", "flight", "delay", "boarding", "destination", "journey", "reservation", "hotel", "tourist", "abroad", "map", "direction", "arrive", "depart", "cancel", "explore", "sightseeing", "guide", "station", "platform", "departure", "arrival", "customs", "currency", "backpack", "accommodation", "adventure"],
  },
  {
    title: "สุขภาพ",
    words: ["sick", "fever", "headache", "cough", "medicine", "pharmacy", "hospital", "doctor", "nurse", "injury", "pain", "exercise", "diet", "recover", "allergy", "sore", "tired", "rest", "sleep", "stress", "weight", "vitamin", "patient", "treatment", "clinic", "emergency", "ambulance"],
  },
  {
    title: "ผู้คนและนิสัย",
    words: ["friend", "family", "stranger", "relative", "parent", "cousin", "partner", "couple", "boss", "guest", "host", "teenager", "adult", "generous", "selfish", "polite", "rude", "honest", "friendly", "shy", "brave", "lazy", "kind", "funny", "loyal", "mean"],
  },
  {
    title: "คำกริยาที่ใช้บ่อย",
    words: ["achieve", "improve", "encourage", "persuade", "suggest", "recommend", "explain", "describe", "remind", "realize", "consider", "decide", "prefer", "expect", "avoid", "prevent", "require", "include", "manage", "mention", "complain", "argue", "agree", "refuse", "accept", "allow", "offer", "ignore", "compare", "depend"],
  },
  {
    title: "คำคุณศัพท์ที่ใช้บ่อย",
    words: ["available", "obvious", "similar", "familiar", "reliable", "responsible", "necessary", "possible", "impossible", "important", "serious", "simple", "complicated", "difficult", "easy", "useful", "useless", "ordinary", "unique", "typical", "accurate", "efficient", "flexible", "urgent", "valuable", "essential", "major", "minor", "recent", "modern"],
  },
];

const dictionary = JSON.parse(readFileSync(new URL("../src/data/dictionary.json", import.meta.url), "utf8"));
const byTerm = new Map(dictionary.map((entry) => [entry.t, entry]));
const meaningOf = (entry) => entry.s[0].m.join(", ");

// Small seeded PRNG (mulberry32) so the random deck is reproducible.
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const used = new Set();
const problems = [];
const decks = TOPICS.map((topic) => {
  const cards = [];
  for (const term of topic.words) {
    const entry = byTerm.get(term);
    if (!entry) problems.push(`"${term}" ไม่มีในพจนานุกรม`);
    else if (used.has(term)) problems.push(`"${term}" ซ้ำกับกองอื่น`);
    else {
      used.add(term);
      cards.push({ term, meaning: meaningOf(entry) });
    }
  }
  return { title: topic.title, cards };
});

// Random deck: single words (no phrasal verbs) that aren't in any topic deck.
const random = mulberry32(seed);
const pool = dictionary.filter((entry) => !used.has(entry.t) && !entry.t.includes(" "));
for (let index = pool.length - 1; index > 0; index -= 1) {
  const target = Math.floor(random() * (index + 1));
  [pool[index], pool[target]] = [pool[target], pool[index]];
}
const picked = pool.slice(0, randomCount).sort((a, b) => a.t.localeCompare(b.t));
picked.forEach((entry) => used.add(entry.t));
decks.push({
  title: "สุ่มรวมหลายหมวด",
  cards: picked.map((entry) => ({ term: entry.t, meaning: meaningOf(entry) })),
});

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const output = { source: "src/data/dictionary.json", seed, decks };
writeFileSync(new URL("../src/data/mock-decks.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");

const total = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
for (const deck of decks) {
  console.log(`${deck.title}: ${deck.cards.length} คำ`);
}
console.log(`รวม ${total} คำ ไม่ซ้ำกัน ${used.size} คำ → src/data/mock-decks.json`);
