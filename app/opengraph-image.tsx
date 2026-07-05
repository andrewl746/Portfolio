import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Andrew Li, incoming Waterloo CS student";

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
          backgroundColor: "#08080c",
          color: "#ececf1",
          fontSize: 40,
        }}
      >
        <div style={{ color: "#e04654", fontSize: 28, fontFamily: "monospace" }}>
          waterloo cs, class of 2031
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16 }}>
          Andrew Li
        </div>
        <div style={{ color: "#8a8a94", marginTop: 24, maxWidth: 900 }}>
          I enjoy building software that makes people's lives a little easier.
        </div>
        <div
          style={{
            color: "#8a8a94",
            fontSize: 26,
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
