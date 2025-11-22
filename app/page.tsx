import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";
import BestSeller from './_components/BestSeller';
import About from './_components/About';
import Footer from './_components/Footer';
import BottomNav from "./_components/BottomNav";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - VAM Enterprises",
  description: "VAM Enterprises is your one-stop gifting solution for exclusive and premium luxury gifts. We offer a wide range of unique gifts for both retail and bulk orders. Shop our bestsellers and discover the perfect gift today!",
  keywords: "gifting solution, premium gifts, luxury gifts, unique gifts, corporate gifts, bulk gifts, VAM Enterprises",
};
export default function Home() {
  const router = useRouter();

  return (
      <main className="overflow-x-hidden">
        <Navbar/>
        <Hero/>
        <BestSeller/>
        <About/>
        <Footer/>
        <BottomNav/>
      </main>
  );
}