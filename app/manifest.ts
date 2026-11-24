import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sheyilor Photography",
    short_name: "Sheyilor",
    description: "Portraits, weddings and fashion, photographed in Lagos.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F2EE",
    theme_color: "#151515",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
