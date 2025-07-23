"use client";

import { useEffect, useState } from "react";
import { fetchHashtagPost } from "@/lib/server-actions";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import TootCardFull from "./tootCardFull";

interface HashtagPostCardProps {
  postUrl: string;
}

export default function HashtagPostCard({ postUrl }: HashtagPostCardProps) {
  const [postData, setPostData] = useState<{
    post: SimplePost;
    author: SimpleActor;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchHashtagPost(postUrl);
        setPostData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postUrl]);

  if (loading) {
    return (
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 break-inside-avoid mb-6">
        <div className="text-red-600 text-sm">
          <p className="font-semibold">Failed to load post</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs opacity-75">URL: {postUrl}</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 break-inside-avoid mb-6">
        <div className="text-yellow-600 text-sm">
          <p className="font-semibold">Post not available</p>
          <p className="mt-1">This post could not be fetched via ActivityPub</p>
          <p className="mt-2 text-xs opacity-75">URL: {postUrl}</p>
        </div>
      </div>
    );
  }

  return <TootCardFull post={postData.post} author={postData.author} />;
}
