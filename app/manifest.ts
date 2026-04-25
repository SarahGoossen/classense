import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Classense",
    short_name: "Classense",
    description: "Classense keeps teaching plans, classes, logs, library items, and reminders organized.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
