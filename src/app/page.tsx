import BeforeAfterSection from "@/components/website/before-after";
import { SiteFooter } from "@/components/website/footer";
import { HeroSection } from "@/components/website/hero";
import JourneyCtaSection from "@/components/website/journey-cta";
import { Navbar } from "@/components/website/navbar";
import TestimonialsCarousel from "@/components/website/testimonials";

export default function Page() {
  return (
    <div className="min-h-svh antialiased">
      <Navbar />
      <HeroSection />
      <BeforeAfterSection />
      <TestimonialsCarousel />
      <JourneyCtaSection />
      <SiteFooter />
    </div>
  );
}
