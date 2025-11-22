'use client';

import About from "@/app/_components/About";
import Footer from "@/app/_components/Footer";
import Navbar from "@/app/_components/Navbar";

import { useRouter } from "next/navigation";

export default function AboutUsPage() {
  const router = useRouter();

  return (
      <main>
        <Navbar/>
        <About/>
        <Footer/>
      </main>
  );
}