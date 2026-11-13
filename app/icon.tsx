import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1115",
          color: "#4fd1c5",
          fontSize: 220,
          fontWeight: 800,
        }}
      >
        RC
      </div>
    ),
    size,
  );
}
