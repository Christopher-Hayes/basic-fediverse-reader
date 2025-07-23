import { Suspense } from "react";
import TootCardFull from "./tootCardFull";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";

interface StreamingPostCardProps {
  postPromise: Promise<{ post: SimplePost; author: SimpleActor } | null>;
}

function StreamingPostCard({ postPromise }: StreamingPostCardProps) {
  return (
    <Suspense
      fallback={
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
      }
    >
      <PostCardResolver postPromise={postPromise} />
    </Suspense>
  );
}

async function PostCardResolver({
  postPromise,
}: {
  postPromise: Promise<{ post: SimplePost; author: SimpleActor } | null>;
}) {
  const result = await postPromise;

  if (!result) {
    return null; // Don't render anything if the post failed to load
  }

  return <TootCardFull post={result.post} author={result.author} />;
}

export default StreamingPostCard;
