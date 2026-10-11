import { ImageResponse } from "next/og";

export const alt =
  "Reggie Sackey-Addo — Product Engineer & AI Product Builder";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fdfcfa",
          color: "#171717",
          padding: "72px 84px",
          border: "1px solid #e5e5e5",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #d4d4d4",
            borderRadius: 18,
            fontSize: 58,
            fontWeight: 700,
          }}
        >
          R
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 700,
              letterSpacing: "-2.5px",
            }}
          >
            Reggie Sackey-Addo
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#525252",
            }}
          >
            Product Engineer & AI Product Builder
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#737373",
          }}
        >
          reggiesackey.co
        </div>
      </div>
    ),
    size,
  );
}
