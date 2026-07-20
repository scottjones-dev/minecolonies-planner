import { ImageResponse } from "next/og";

export const alt = "MineColonies Planner — plan before you place";
export const size = { width: 1_200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0c1715",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "space-between",
        padding: "76px 82px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "63%" }}>
        <div
          style={{
            color: "#6ee7b7",
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
            marginBottom: 34,
          }}
        >
          MINECOLONIES PLANNER
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 70,
            fontWeight: 700,
            letterSpacing: -4,
            lineHeight: 1.02,
          }}
        >
          Plan before you place.
        </div>
        <div
          style={{
            color: "rgba(255,255,255,.6)",
            display: "flex",
            fontSize: 27,
            lineHeight: 1.4,
            marginTop: 28,
          }}
        >
          Block-accurate footprints, square claims, commutes, and guard
          coverage.
        </div>
      </div>
      <div
        style={{
          background: "#17231f",
          border: "2px solid rgba(110,231,183,.35)",
          display: "flex",
          flexDirection: "column",
          height: 390,
          padding: 22,
          position: "relative",
          width: 330,
        }}
      >
        <div
          style={{
            border: "3px dashed #fcd34d",
            display: "flex",
            flex: 1,
            padding: 30,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#047857",
              border: "2px solid #6ee7b7",
              display: "flex",
              flex: 1,
              fontSize: 22,
              fontWeight: 700,
              justifyContent: "center",
            }}
          >
            TOWN HALL
          </div>
        </div>
        <div
          style={{
            color: "#6ee7b7",
            display: "flex",
            fontSize: 18,
            marginTop: 18,
          }}
        >
          Claim valid
        </div>
      </div>
    </div>,
    size,
  );
}
