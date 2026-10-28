import About from "@/components/About";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import MyJourney from "@/components/MyJourney";
import MyProjects from "@/components/MyProjects";
import MyServices from "@/components/MyServices";
import Preloader from "@/components/Preloader";

export default function Home() {
  return (
    <>
      <Preloader />
      <main className="px-8 xl:px-24">
        <Hero />
        <MyServices />
        <MyProjects />
        <MyJourney />
        <About />
        <Contact />
      </main>
    </>
  );
}
