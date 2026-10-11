import { candidate } from "@/config/candidate";
import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://reggiesackey.co";
const publicName = "Reggie Sackey-Addo";
const siteDescription =
  "Product engineer and AI product builder focused on useful software, integrations, decision-support tools, and agent-assisted product experiences.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${publicName} — Product Engineer & AI Product Builder`,
    template: `%s — ${publicName}`,
  },
  description: siteDescription,
  applicationName: publicName,
  authors: [{ name: publicName, url: siteUrl }],
  creator: publicName,
  publisher: publicName,
  keywords: [
    "Reggie Sackey-Addo",
    "Reg Sackey-Addo",
    "product engineer",
    "AI product engineer",
    "AI product development",
    "software integrations",
    "decision intelligence",
    "agent-assisted software development",
    "portfolio",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: publicName,
    title: `${publicName} — Product Engineer & AI Product Builder`,
    description: siteDescription,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${publicName} — Product Engineer & AI Product Builder`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${publicName} — Product Engineer & AI Product Builder`,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: publicName,
  alternateName: candidate.name,
  url: siteUrl,
  jobTitle: "Product Engineer",
  description: siteDescription,
  homeLocation: {
    "@type": "Place",
    name: "Oakland, California, United States",
  },
  sameAs: ["https://github.com/ReggieSackey"],
  knowsAbout: [
    "Product engineering",
    "AI product development",
    "Software integrations",
    "Decision intelligence",
    "Agent-assisted software development",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: publicName,
  alternateName: "reggiesackey.co",
  url: siteUrl,
  description: siteDescription,
  inLanguage: "en-US",
  publisher: {
    "@type": "Person",
    name: publicName,
    url: siteUrl,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
