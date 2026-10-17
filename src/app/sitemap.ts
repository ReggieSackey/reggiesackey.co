import type { MetadataRoute } from "next";

const siteUrl = "https://reggiesackey.co";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/work`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/application/shopmy-agent-manager`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
