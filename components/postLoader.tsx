"use client";

import { Suspense, useState, useEffect } from "react";
import Toot from "@/components/toot";
import TootAuthorClient from "@/components/tootAuthorClient";
import Image from "next/image";
import ImageOverlay from "@/public/image-overlay.svg";
import classnames from "classnames";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import { fetchPostData } from "@/lib/server-actions";
import { extractServerFromUrl } from "@/util/helpers";

type PostData = {
  post: SimplePost & {
    content?: string;
  };
  author: SimpleActor;
  images?: Array<{
    url: string;
    name?: string;
    width?: number;
    height?: number;
  }>;
};

function PostContent({ postUrl }: { postUrl: string }) {
  const [postData, setPostData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPostData(postUrl)
      .then((data) => {
        setPostData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching post:", err);
        setError(err?.message || "Failed to load post");
        setLoading(false);
      });
  }, [postUrl]);

  if (loading) {
    return <PostSkeleton />;
  }

  if (error || !postData) {
    return (
      <div className="px-8 pt-8 sm:pt-16 pb-32 sm:pb-48 h-screen flex flex-col gap-8">
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl">Sorry!</h1>
          <h2>Unable to fetch post.</h2>
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded max-w-lg text-center">
              <p className="font-semibold mb-2">Error: {error}</p>
              {error.includes("defederated") && (
                <p className="text-sm">
                  <strong>What is defederation?</strong> Some servers block
                  federation with other servers to moderate content. This means
                  toots from those servers cannot be accessed through
                  federation.
                </p>
              )}
              {postUrl.includes("mastodon.art") && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                  <p className="font-semibold">Note about mastodon.art:</p>
                  <p>
                    This server is known to not federate with almost all of the
                    fediverse. They have extensively defederated from most other
                    servers, making their toots inaccessible through federation.
                  </p>
                </div>
              )}
            </div>
          )}
          <p>
            Toot URL:{" "}
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-muted underline"
            >
              {postUrl}
            </a>
          </p>
          <p className="text-sm text-fg-muted max-w-md text-center">
            This might be due to the source server being defederated (blocking
            federation), the server blocking requests, or the toot being
            unavailable.
          </p>
        </div>
      </div>
    );
  }

  const { post, author, images = [] } = postData;
  const contentHtml = post?.content?.toString() ?? "";

  return (
    <div
      className={classnames(
        "min-h-screen flex overflow-hidden gap-16",
        !!images.length ? "justify-normal" : "justify-center",
      )}
    >
      {!!images.length && (
        <>
          {/* desktop */}
          <aside className="hidden sm:block absolute sm:relative z-0 min-h-screen w-full max-w-[40vw] overflow-hidden">
            <Image
              src={images[0].url}
              alt={images[0].name ?? ""}
              width={images[0].width ?? 600}
              height={images[0].height ?? 800}
              quality={90}
              className="w-full h-full max-h-screen object-cover filter sepia brightness-95"
            />
            <ImageOverlay className="absolute z-10 text-bg -right-[33vh] -top-[3vh] h-[106vh] w-[45vh]" />
            <ImageOverlay className="absolute z-10 text-bg-darker -left-[33vh] -top-[3vh] h-[106vh] w-[45vh]" />
          </aside>
          <aside className="sm:hidden absolute sm:relative z-0 min-h-screen w-full overflow-hidden">
            <Image
              src={images[0].url}
              alt={images[0].name ?? ""}
              width={images[0].width ?? 600}
              height={images[0].height ?? 800}
              quality={90}
              className="w-full min-h-screen max-h-screen object-cover filter grayscale contrast-75"
            />
          </aside>
        </>
      )}
      <main className="w-full max-w-[1000px] flex-grow flex justify-center min-h-screen bg-bg py-12 sm:py-16">
        <div className="h-full w-full max-w-2xl flex flex-col gap-8 items-center justify-center">
          {post && (
            <>
              <div className="w-full flex-grow flex flex-col justify-center pt-24 sm:pt-0">
                <Toot
                  contents={contentHtml}
                  emojis={post.emojis}
                  server={
                    extractServerFromUrl(author?.url) ||
                    extractServerFromUrl(post.url) ||
                    undefined
                  }
                />
              </div>
              {author && (
                <footer className="w-full">
                  <TootAuthorClient post={post} author={author} />
                </footer>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="min-h-screen flex overflow-hidden gap-16 justify-center">
      <main className="w-full max-w-[1000px] flex-grow flex justify-center min-h-screen bg-bg py-12 sm:py-16">
        <div className="h-full w-full max-w-2xl flex flex-col gap-8 items-center justify-center">
          {/* Content skeleton */}
          <div className="w-full flex-grow flex flex-col justify-center pt-24 sm:pt-0">
            <div className="space-y-4">
              <div className="h-6 bg-bg-darker animate-pulse rounded w-full"></div>
              <div className="h-6 bg-bg-darker animate-pulse rounded w-5/6"></div>
              <div className="h-6 bg-bg-darker animate-pulse rounded w-4/6"></div>
              <div className="h-6 bg-bg-darker animate-pulse rounded w-3/6"></div>
            </div>
          </div>

          {/* Author skeleton */}
          <footer className="w-full">
            <div className="w-full px-4 py-12 flex gap-x-4 gap-y-24 sm:gap-y-12 flex-col sm:flex-row items-center justify-between">
              <div className="flex-grow relative flex gap-4 items-center flex-col sm:flex-row">
                <div className="w-16 h-16 bg-bg-darker animate-pulse rounded-full"></div>
                <div className="hidden sm:flex flex-col gap-1">
                  <div className="h-6 bg-bg-darker animate-pulse rounded mb-2 w-48"></div>
                  <div className="h-4 bg-bg-darker animate-pulse rounded w-32"></div>
                </div>
                <div className="flex sm:hidden items-center gap-1">
                  <div className="h-4 bg-bg-darker animate-pulse rounded w-8 mr-2"></div>
                  <div className="h-5 bg-bg-darker animate-pulse rounded w-24"></div>
                </div>
                <div className="flex flex-col gap-1 text-center sm:text-right">
                  <div className="h-5 bg-bg-darker animate-pulse rounded w-20"></div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function PostLoader({ postUrl }: { postUrl: string }) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent postUrl={postUrl} />
    </Suspense>
  );
}
