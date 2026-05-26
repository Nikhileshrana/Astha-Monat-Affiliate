import { Montserrat } from "next/font/google";

import { HeroSection } from "@/components/website/hero";
import { Navbar } from "@/components/website/navbar";
import MasonryGridDemo from "@/components/website/testimonials";

const monatSans = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export default function Page() {
  return (
    <div className={`${monatSans.className} min-h-svh antialiased`}>
      <Navbar />
      <HeroSection />
      <MasonryGridDemo />
    </div>
  );
}
