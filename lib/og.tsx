import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function renderOg(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background: "#0f1115",
          color: "#e8eaed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, color: "#4fd1c5", fontWeight: 800, letterSpacing: 2, display: "flex" }}>
          RECENT CODES
        </div>
        <div
          style={{
            fontSize: title.length > 40 ? 56 : 72,
            fontWeight: 800,
            marginTop: 20,
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#9aa0a6", display: "flex" }}>{subtitle}</div>
      </div>
    ),
    OG_SIZE,
  );
}
