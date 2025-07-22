import Nav from "@/components/nav";
import Image from "next/image";
import Splash from "@/public/homepage-splash.svg";
import HomepagePostsLoader from "@/components/homepagePostsLoader";

export default function Home() {
  return (
    <main className="px-8 py-8 sm:py-16 min-h-screen flex flex-col gap-8 items-center justify-between">
      <Nav />
      <div className="w-screen overflow-hidden flex-grow flex flex-col justify-center items-center gap-12">
        <Splash className="max-w-2xl" />
        <HomepagePostsLoader />
      </div>
      <footer className="py-8 px-4 flex items-center justify-center">
        <a
          className="text-fg-muted flex items-center gap-3 hover:underline hover:underline-offset-4 focus:underline focus:underline-offset-4 hover:text-fg focus:text-fg"
          href="https://github.com/Christopher-Hayes/basic-fediverse-reader"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/code.svg"
            alt="Source code icon"
            width={24}
            height={24}
          />
          Source
        </a>
      </footer>
    </main>
  );
}
