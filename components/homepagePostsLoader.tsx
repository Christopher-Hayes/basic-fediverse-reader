"use client";

import { Suspense, useState, useEffect } from "react";
import TootCard from "@/components/tootCard";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import { fetchPostsData } from "@/lib/server-actions";
import Link from "next/link";

function HomepagePostsContent() {
  const [posts, setPosts] = useState<
    Array<{ post: SimplePost; author: SimpleActor }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostsData("@chris@floss.social", 3)
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <HomepagePostsSkeleton />;
  }

  if (posts.length === 0) {
    return null; // Don't show anything if no posts
  }

  return (
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
  );
}

function HomepagePostsSkeleton() {
  return (
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
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="w-full max-w-sm">
            <div className="bg-bg-lighter border-4 border-bg-darker rounded-2xl p-6">
              {/* Author skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-bg-darker animate-pulse rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-bg-darker animate-pulse rounded mb-1 w-24"></div>
                  <div className="h-3 bg-bg-darker animate-pulse rounded w-20"></div>
                </div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-bg-darker animate-pulse rounded w-full"></div>
                <div className="h-4 bg-bg-darker animate-pulse rounded w-4/5"></div>
                <div className="h-4 bg-bg-darker animate-pulse rounded w-3/5"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomepagePostsLoader() {
  return (
    <Suspense fallback={<HomepagePostsSkeleton />}>
      <HomepagePostsContent />
    </Suspense>
  );
}
