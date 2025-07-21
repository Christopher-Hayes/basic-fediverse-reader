import Nav from "@/components/nav";
import TootCard from "@/components/tootCard";
import Image from "next/image";
import Splash from "@/public/homepage-splash.svg";
import {
  fetchUserPosts,
  type SimplePost,
  type SimpleActor,
} from "@/util/fetchPost";

export default async function Home() {
  // Fetch sample posts for the homepage
  const posts = await fetchUserPosts("@chris@floss.social", 3);

  return (
    <main className="px-8 py-8 sm:py-16 min-h-screen flex flex-col gap-8 items-center justify-between">
      <Nav />
      <div className="w-screen overflow-hidden flex-grow flex flex-col justify-center items-center gap-12">
        <Splash className="max-w-2xl" />

        {/* Featured posts section */}
        {posts.length > 0 && (
          <section className="w-full max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-center mb-8 text-fg">
              Recent Posts from{" "}
              <span className="text-amber-700">@chris@floss.social</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {posts
                .slice(0, 3)
                .map(
                  (
                    postData: { post: SimplePost; author: SimpleActor },
                    index: number,
                  ) => (
                    <TootCard
                      key={`${postData.post.id?.toString()}-${index}`}
                      post={postData.post}
                      author={postData.author}
                    />
                  ),
                )}
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
