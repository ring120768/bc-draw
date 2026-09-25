import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Breakfast Club Draw",
    short_name: "BC Draw",
    description: "Weekend swindle draw for The Breakfast Club",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#1a5632",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
