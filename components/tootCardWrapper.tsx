import { Suspense } from "react";
import TootCardFull from "./tootCardFull";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";

interface TootCardWrapperProps {
  post: SimplePost;
  author: SimpleActor;
}

export default function TootCardWrapper({
  post,
  author,
}: TootCardWrapperProps) {
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
        </div>
      }
    >
      <TootCardFull post={post} author={author} />
    </Suspense>
  );
}
