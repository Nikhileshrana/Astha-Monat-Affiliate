import BeforeAfterSection from "@/components/website/before-after";
import { SiteFooter } from "@/components/website/footer";
import { HeroSection } from "@/components/website/hero";
import JourneyCtaSection from "@/components/website/journey-cta";
import { Navbar } from "@/components/website/navbar";
import ProductsSection from "@/components/website/products";
import TestimonialsCarousel from "@/components/website/testimonials";

export default function Page() {
  return (
    <div className="min-h-svh antialiased">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <TestimonialsCarousel />
      <BeforeAfterSection />
      <JourneyCtaSection />
      <SiteFooter />
    </div>
  );
}
