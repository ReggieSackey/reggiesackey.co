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

export const metadata: Metadata = {
  title: {
    default: `${candidate.name} — ${candidate.headline}`,
    template: `%s — ${candidate.name}`,
  },
  description: `Paste a job description and get a grounded analysis of ${candidate.name}'s fit for the role.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
