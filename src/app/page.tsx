import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

export default function Home() {
  return <PortfolioHome initialProfile={howIWorkFallback} />;
}
