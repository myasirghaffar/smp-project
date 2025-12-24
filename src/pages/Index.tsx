import Header from "@/components/Header";
import SEO from "@/components/SEO";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const Index = () => {
  return (
    <>
      <SEO />
      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <CategoriesSection />
          <HowItWorks />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
};

export default Index;
