import { ImageResponse } from "next/og";

export const alt = "FlashFlip — ฝึกจำคำศัพท์ภาษาอังกฤษ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "FlashFlip";
const TAGLINE = "ฝึกจำคำศัพท์ภาษาอังกฤษ";
const SUB = "พิมพ์คำ เลือกความหมาย แล้วสุ่มฝึกคำที่ยังจำไม่ได้";

// Satori can't read woff2, so ask Google Fonts for a TTF subset of just the glyphs we draw.
async function loadFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error(`Font not found: ${family}`);
  return (await fetch(src[1])).arrayBuffer();
}

export default async function Image() {
  const [nunito, thaiBold, thaiSemi] = await Promise.all([
    loadFont("Nunito", 900, TITLE + "Aa"),
    loadFont("Noto Sans Thai Looped", 800, TAGLINE),
    loadFont("Noto Sans Thai Looped", 600, SUB),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          gap: 80,
          background: "#fbf6f0",
          color: "#2a2340",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 360, height: 340 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 20,
              width: 260,
              height: 200,
              borderRadius: 48,
              background: "#ffb3c7",
              transform: "rotate(-10deg)",
              boxShadow: "0 24px 40px -16px rgba(150,120,220,.35)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 120,
              width: 260,
              height: 200,
              borderRadius: 48,
              background: "linear-gradient(180deg, #e2d8ff, #b49bfc)",
              transform: "rotate(6deg)",
              boxShadow: "0 24px 40px -16px rgba(150,120,220,.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Nunito",
              fontSize: 64,
              color: "#3b2f63",
            }}
          >
            Aa
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontFamily: "Nunito", fontSize: 120, lineHeight: 1, letterSpacing: -2 }}>{TITLE}</div>
          <div style={{ fontFamily: "Thai", fontWeight: 800, fontSize: 52, marginTop: 28, color: "#3b2f63" }}>
            {TAGLINE}
          </div>
          <div style={{ fontFamily: "Thai", fontWeight: 600, fontSize: 32, marginTop: 14, color: "#6e6785" }}>
            {SUB}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Nunito", data: nunito, weight: 900, style: "normal" },
        { name: "Thai", data: thaiBold, weight: 800, style: "normal" },
        { name: "Thai", data: thaiSemi, weight: 600, style: "normal" },
      ],
    },
  );
}
