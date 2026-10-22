import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import Steps from "@/components/home/Steps";
import WhyUs from "@/components/home/WhyUs";
import DownloadApp from "@/components/home/DownloadApp";
import ChooseYourService from "@/components/home/ChooseYourService";
import FAQ from "@/components/home/FAQ";
import OrderCTA from "@/components/home/OrderCTA";
import { siteUrl } from "@/lib/data";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Shiny Carpet",
            alternateName: "Shiny Carpet",
            url: siteUrl,
            inLanguage: "ar",
          }),
        }}
      />
      <Hero />
      <Services />
      <Steps />
      <WhyUs />
      <DownloadApp />
      <ChooseYourService />
      <FAQ />
      <OrderCTA />
    </>
  );
}
