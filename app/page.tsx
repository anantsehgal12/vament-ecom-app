'use client';

import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";
import BestSeller from './_components/BestSeller';
import About from './_components/About';
import Footer from './_components/Footer';
import BottomNav from "./_components/BottomNav";
import { useRouter } from "next/navigation";

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