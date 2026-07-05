import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Andrew Li, Computer Science student at the University of Waterloo";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#07080d",
          color: "#eceef4",
          fontSize: 40,
        }}
      >
        <div
          style={{
            color: "#a8895a",
            fontSize: 24,
            fontFamily: "monospace",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Observation log
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16 }}>
          Andrew Li
        </div>
        <div
          style={{
            width: 64,
            height: 4,
            backgroundColor: "#e0455f",
            marginTop: 28,
          }}
        />
        <div style={{ color: "#828aa3", marginTop: 28, maxWidth: 900, fontSize: 34 }}>
          Computer Science student at the University of Waterloo.
        </div>
        <div
          style={{
            color: "#6a7088",
            fontSize: 24,
            marginTop: 48,
            fontFamily: "monospace",
          }}
        >
          andrewli.app
        </div>
      </div>
    ),
    size
  );
}
