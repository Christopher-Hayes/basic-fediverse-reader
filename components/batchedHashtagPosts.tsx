"use client";

import { useEffect, useState } from "react";
import { fetchHashtagPostsBatch } from "@/lib/server-actions";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import TootCardFull from "./tootCardFull";

interface BatchedHashtagPostsProps {
  postUrls: string[];
}

export default function BatchedHashtagPosts({
  postUrls,
}: BatchedHashtagPostsProps) {
  const [posts, setPosts] = useState<
    Array<{ post: SimplePost; author: SimpleActor } | null | undefined>
  >([]);
  const [loadingBatches, setLoadingBatches] = useState<number[]>([]);

  useEffect(() => {
    async function loadPosts() {
      if (postUrls.length === 0) {
        return;
      }

      // Split URLs into batches of 5
      const batches: string[][] = [];
      for (let i = 0; i < postUrls.length; i += 5) {
        batches.push(postUrls.slice(i, i + 5));
      }

      // Initialize posts array with undefined (meaning not yet attempted)
      setPosts(new Array(postUrls.length).fill(undefined));
      setLoadingBatches(Array.from({ length: batches.length }, (_, i) => i));

      // Load batches sequentially with a slight delay to avoid overwhelming the server
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const startIndex = batchIndex * 5;

        try {
          console.log(
            `Loading batch ${batchIndex + 1}/${batches.length}: ${batch.length} posts`,
          );
          const batchResults = await fetchHashtagPostsBatch(batch);

          // Update posts state with results from this batch
          setPosts((currentPosts) => {
            const newPosts = [...currentPosts];
            batchResults.forEach((result, index) => {
              newPosts[startIndex + index] = result;
            });
            return newPosts;
          });

          // Remove this batch from loading state
          setLoadingBatches((current) =>
            current.filter((i) => i !== batchIndex),
          );

          // Add a small delay between batches to be nice to the server
          if (batchIndex < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to load batch ${batchIndex + 1}:`, error);
          // Remove this batch from loading state even if it failed
          setLoadingBatches((current) =>
            current.filter((i) => i !== batchIndex),
          );
        }
      }
    }

    loadPosts();
  }, [postUrls]);

  const LoadingCard = ({ batchIndex }: { batchIndex: number }) => (
    <div className="bg-bg-lighter border-2 border-bg-darker rounded-lg p-6 break-inside-avoid mb-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-bg-darker"></div>
        <div className="flex-grow">
          <div className="h-4 bg-bg-darker rounded mb-2 w-32"></div>
          <div className="h-3 bg-bg-darker rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-bg-darker rounded w-full"></div>
        <div className="h-4 bg-bg-darker rounded w-3/4"></div>
        <div className="h-4 bg-bg-darker rounded w-1/2"></div>
      </div>
      <div className="pt-3 border-t border-bg-darker">
        <div className="h-3 bg-bg-darker rounded w-24"></div>
      </div>
      <div className="text-xs text-fg-muted mt-2 text-center">
        Loading batch {batchIndex + 1}...
      </div>
    </div>
  );

  const NotAvailableCard = ({ url }: { url: string }) => (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 break-inside-avoid mb-6">
      <div className="text-yellow-600 text-sm">
        <p className="font-semibold">Post not available</p>
        <p className="mt-1">This post could not be fetched via ActivityPub</p>
        <p className="mt-2 text-xs opacity-75">URL: {url}</p>
      </div>
    </div>
  );

  return (
    <div className="columns-1 md:columns-2 gap-6">
      {postUrls.map((url, index) => {
        const batchIndex = Math.floor(index / 5);
        const post = posts[index];

        // Show loading card if this batch is still loading OR if post is undefined (not yet attempted)
        if (loadingBatches.includes(batchIndex) || post === undefined) {
          // Only show one loading card per batch to avoid clutter
          if (index % 5 === 0) {
            return (
              <LoadingCard
                key={`loading-${batchIndex}`}
                batchIndex={batchIndex}
              />
            );
          }
          return null;
        }

        // Show post if successfully loaded
        if (post) {
          return (
            <TootCardFull key={index} post={post.post} author={post.author} />
          );
        }

        // Show not available card if post failed to load (post === null)
        return <NotAvailableCard key={index} url={url} />;
      })}
    </div>
  );
}
