import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reggie Sackey-Addo",
    short_name: "Reggie",
    description:
      "Product engineer and AI product builder portfolio for Reggie Sackey-Addo.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfcfa",
    theme_color: "#fdfcfa",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
