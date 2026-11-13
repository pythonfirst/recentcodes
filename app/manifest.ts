import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recent Codes",
    short_name: "Recent Codes",
    description: "Verifiable official game redeem codes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1115",
    theme_color: "#0f1115",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
