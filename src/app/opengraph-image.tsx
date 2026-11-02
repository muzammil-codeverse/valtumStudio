import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Valtum Studio. Good ideas. Beautifully built.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "62px 72px 56px",
        backgroundColor: "#171824",
        color: "#F5F4FA",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 58,
              width: 58,
              borderRadius: 15,
              backgroundColor: "#C7C2FE",
              color: "#262447",
              fontSize: 30,
              fontWeight: 800
            }}
          >
            V
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>
            VALTUM STUDIO
          </span>
        </div>
        <span style={{ fontSize: 17, color: "#C9C8DA", letterSpacing: 2 }}>
          AUSTRALIA · WORLDWIDE
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 82, fontWeight: 700, letterSpacing: -4 }}>
          Good ideas.
        </div>
        <div
          style={{ fontSize: 82, fontWeight: 700, letterSpacing: -4, color: "#CAC6FF" }}
        >
          Beautifully built.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #424154",
          paddingTop: 23,
          justifyContent: "space-between",
          color: "#C6C5D7",
          fontSize: 17,
          letterSpacing: 1
        }}
      >
        <span>SOFTWARE · PRODUCT DESIGN · CREATIVE DEVELOPMENT</span>
        <span>valtumstudio.com.au</span>
      </div>
    </div>,
    size
  );
}
