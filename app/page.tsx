import Nav from "@/components/nav";
import Image from "next/image";
import Splash from "@/public/homepage-splash.svg";
import TootCard from "@/components/tootCard";
import Link from "next/link";
import { fetchPostsData } from "@/lib/server-actions";

// Revalidate the page once per day (86400 seconds = 24 hours)
export const revalidate = 86400;

export default async function Home() {
  // Fetch posts on the server side for better performance and caching
  const posts = await fetchPostsData("@chris@floss.social", 3);

  return (
    <main className="px-8 py-8 sm:py-16 min-h-screen flex flex-col gap-8 items-center justify-between">
      <Nav />
      <div className="w-screen overflow-hidden flex-grow flex flex-col justify-center items-center gap-12">
        <Splash className="max-w-2xl" />

        {/* Server-rendered recent posts */}
        {posts.length > 0 && (
          <section className="w-full max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-center mb-8 text-fg">
              Recent Toots from{" "}
              <Link
                href="/profile/@chris@floss.social"
                className="text-amber-700 hover:text-amber-900 focus:text-amber-900 hover:underline decoration-1 underline-offset-2"
              >
                @chris@floss.social
              </Link>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {posts.slice(0, 3).map((postData, index) => (
                <TootCard
                  key={postData.post.id || index}
                  post={postData.post}
                  author={postData.author}
                />
              ))}
            </div>
          </section>
        )}
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
