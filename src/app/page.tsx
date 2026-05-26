import { Montserrat } from "next/font/google";

import { HeroSection } from "@/components/website/hero";
import { Navbar } from "@/components/website/navbar";

const monatSans = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export default function Page() {
  return (
    <div className={`${monatSans.className} min-h-sv antialiased`}>
      <Navbar />
      <HeroSection />
    </div>
  );
}
