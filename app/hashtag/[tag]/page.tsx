import { Suspense } from "react";
import Link from "next/link";
import { searchHashtagStreaming } from "@/util/hashtagSearch";
import BatchedHashtagPosts from "@/components/batchedHashtagPosts";

interface HashtagPageProps {
  params: Promise<{
    tag: string;
  }>;
  searchParams: Promise<{
    server?: string;
  }>;
}

function HashtagHeader({ tag }: { tag: string }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-bg-lighter rounded-lg p-6 border-2 border-bg-darker">
        <h1 className="text-3xl font-bold text-fg mb-4">
          #{decodeURIComponent(tag)}
        </h1>
        <p className="text-fg-muted text-lg">Posts containing this hashtag</p>
      </div>
    </div>
  );
}

async function HashtagResults({
  tag,
  server,
}: {
  tag: string;
  server?: string;
}) {
  const results = await searchHashtagStreaming(tag, server);

  if (results.error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 border-2 border-bg-darker text-center">
          <svg
            className="mx-auto mb-4 text-fg-muted"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="text-xl font-semibold text-fg mb-2">
            {server ? "Search not available" : "Server not specified"}
          </h2>
          <p className="text-fg-muted mb-4">{results.error}</p>
          {!server && (
            <div className="text-sm text-fg-muted bg-bg-lighter p-4 rounded-md">
              <p className="font-semibold mb-2">How hashtag search works:</p>
              <ul className="text-left space-y-1">
                <li>
                  • Searches for posts across the fediverse using
                  floss.social&apos;s API
                </li>
                <li>
                  • Then fetches full post data using ActivityPub for consistent
                  formatting
                </li>
                <li>• Click on hashtags in posts to search for that hashtag</li>
                <li>
                  • Example:{" "}
                  <Link
                    href="/hashtag/art?server=floss.social"
                    className="text-highlight hover:underline"
                  >
                    /hashtag/art?server=floss.social
                  </Link>
                </li>
                <li>
                  • Results come from across the fediverse, not just one server
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (results.postUrls.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 border-2 border-bg-darker text-center">
          <svg
            className="mx-auto mb-4 text-fg-muted"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-fg mb-2">No posts found</h2>
          <p className="text-fg-muted mb-4">
            No posts containing #{tag} were found.
          </p>

          <div className="text-sm text-fg-muted bg-bg-lighter p-4 rounded-md text-left">
            <p className="font-semibold mb-2">Debug Information:</p>
            <ul className="space-y-1">
              <li>• Search method: {results.searchMethod || "unknown"}</li>
              <li>• Total found in search: {results.totalFound}</li>
              <li>• Post URLs found: {results.postUrls.length}</li>
              {results.debugInfo && (
                <li>
                  • Mastodon API found: {results.debugInfo.mastodonApiFound}
                </li>
              )}
              {results.searchMethod === "mastodon-search" && (
                <>
                  <li>• Using floss.social Mastodon API</li>
                  <li>• Then fetching full posts via ActivityPub/Fedify</li>
                </>
              )}
              {results.totalFound > 0 && results.postUrls.length === 0 && (
                <li className="text-amber-600 font-medium">
                  • Warning: Search found {results.totalFound} posts but no
                  valid URLs
                </li>
              )}
            </ul>

            {results.totalFound > 0 && results.postUrls.length === 0 && (
              <div className="mt-3 pt-3 border-t border-bg-darker">
                <p className="font-semibold mb-2 text-amber-700">
                  Possible solutions:
                </p>
                <ul className="space-y-1 text-amber-600">
                  <li>
                    • Some posts may be from servers with ActivityPub federation
                    issues
                  </li>
                  <li>• Posts might be deleted or no longer available</li>
                  <li>
                    • Network timeout connecting to remote fediverse servers
                  </li>
                  <li>• Check browser console for detailed error logs</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-4 text-fg-muted text-sm">
        Found {results.totalFound} posts •
        {results.searchMethod === "mastodon-search" &&
          " Using floss.social API + Fedify"}
        {results.server && ` • Originally from ${results.server}`}
      </div>

      <BatchedHashtagPosts postUrls={results.postUrls} />
    </div>
  );
}

export default async function HashtagPage({
  params,
  searchParams,
}: HashtagPageProps) {
  const { tag } = await params;
  const { server } = await searchParams;

  return (
    <main className="min-h-screen">
      <div className="pt-8 pb-16">
        <HashtagHeader tag={tag} />

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="w-full max-w-6xl mx-auto p-4">
                <div className="mb-4 h-4 bg-bg-darker rounded w-64 animate-pulse"></div>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-bg-lighter border-2 border-bg-darker rounded-lg p-6 break-inside-avoid mb-6 animate-pulse"
                    >
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
                  ))}
                </div>
              </div>
            }
          >
            <HashtagResults tag={tag} server={server} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: HashtagPageProps) {
  const { tag } = await params;
  const { server } = await searchParams;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `#${decodedTag}${server ? ` on ${server}` : ""} - Basic Fediverse Reader`,
    description: `Posts tagged with #${decodedTag}${server ? ` from ${server}` : " from the fediverse"}`,
  };
}
