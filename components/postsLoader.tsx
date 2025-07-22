"use client";

import { Suspense, useState, useEffect } from "react";
import TootCardFull from "@/components/tootCardFull";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import { fetchPostsData } from "@/lib/server-actions";

function PostsContent({ handle }: { handle: string }) {
  const [posts, setPosts] = useState<
    Array<{ post: SimplePost; author: SimpleActor }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPostsData(handle, 6)
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load posts");
        setLoading(false);
      });
  }, [handle]);

  if (loading) {
    return <PostsSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-fg mb-6">Recent Posts</h2>
        <p className="text-lg text-fg-muted">Failed to load posts</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-fg mb-6">Recent Posts</h2>
      {posts.length > 0 ? (
        <div className="columns-1 md:columns-2 gap-6">
          {posts.map((postData, index) => (
            <TootCardFull
              key={index}
              post={postData.post}
              author={postData.author}
            />
          ))}
        </div>
      ) : (
        <p className="text-lg text-fg-muted">No recent posts found</p>
      )}
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-fg mb-6">Recent Posts</h2>
      <div className="columns-1 md:columns-2 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="break-inside-avoid mb-6">
            <div className="bg-bg-lighter border-4 border-bg-darker rounded-2xl p-6">
              {/* Author skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-bg-darker animate-pulse rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-bg-darker animate-pulse rounded mb-1 w-32"></div>
                  <div className="h-3 bg-bg-darker animate-pulse rounded w-24"></div>
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
    </div>
  );
}

export default function PostsLoader({ handle }: { handle: string }) {
  return (
    <Suspense fallback={<PostsSkeleton />}>
      <PostsContent handle={handle} />
    </Suspense>
  );
}
