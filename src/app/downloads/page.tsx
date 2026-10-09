import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

export default function DownloadsPage() {
  return <PortfolioHome initialView="downloads" initialProfile={howIWorkFallback} />;
}
