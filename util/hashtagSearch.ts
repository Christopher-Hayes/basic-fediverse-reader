/**
 * Hashtag search utilities for the fediverse
 *
 * This implementation uses Mastodon's search API to find hashtag posts,
 * then uses Fedify to fetch the full ActivityPub objects for consistent formatting.
 */

import { lookupObject } from "@fedify/fedify";
import { context } from "./federation";
import { Note, type Actor } from "@fedify/fedify/vocab";
import type { SimplePost, SimpleActor } from "./fetchPost";
import { extractCustomEmojis } from "./emoji";

export type HashtagSearchResult = {
  posts: Array<{ post: SimplePost; author: SimpleActor }>;
  totalFound: number;
  hashtag: string;
  server?: string;
  searchMethod?: "mastodon-search" | "not-supported";
  error?: string;
};

/**
 * Mastodon search API response for status search
 */
interface MastodonSearchResponse {
  accounts: any[];
  statuses: Array<{
    id: string;
    url: string;
    uri: string;
    created_at: string;
    content: string;
    account: {
      id: string;
      username: string;
      display_name: string;
      acct: string;
      url: string;
      avatar?: string;
    };
  }>;
  hashtags: any[];
}

/**
 * Search for hashtag posts using Mastodon API, then fetch with Fedify
 *
 * @param hashtag The hashtag to search for (without #)
 * @param limit Maximum number of posts to return
 * @returns Search results or null if not supported
 */
async function searchMastodonHashtag(
  hashtag: string,
  limit = 20,
): Promise<HashtagSearchResult | null> {
  try {
    const accessToken = process.env.MASTODON_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn("MASTODON_ACCESS_TOKEN not configured");
      return null;
    }

    // Use floss.social for hashtag search (since we have a floss.social token)
    const searchUrl = `https://floss.social/api/v2/search`;
    const searchQuery = `#${hashtag}`;

    const response = await fetch(
      `${searchUrl}?q=${encodeURIComponent(searchQuery)}&type=statuses&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      },
    );

    if (!response.ok) {
      console.warn(
        `Mastodon search failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const searchResult: MastodonSearchResponse = await response.json();

    if (!searchResult.statuses || searchResult.statuses.length === 0) {
      return {
        posts: [],
        totalFound: 0,
        hashtag,
        searchMethod: "mastodon-search",
      };
    }

    // Now use Fedify to fetch the full ActivityPub objects
    const { documentLoader } = context;
    const posts: Array<{ post: SimplePost; author: SimpleActor }> = [];

    for (const mastodonPost of searchResult.statuses) {
      try {
        // Use the ActivityPub URI (not the web URL) for better federation compatibility
        const activityPubUrl = mastodonPost.uri || mastodonPost.url;

        // Fetch the post using Fedify
        const note = (await lookupObject(activityPubUrl, {
          documentLoader,
        })) as Note;

        if (note instanceof Note) {
          // Get the author from the note's attribution
          const attributions = await note.getAttribution({ documentLoader });
          const authorUrl = attributions
            ? Array.isArray(attributions)
              ? attributions[0]?.id?.toString()
              : attributions?.id?.toString()
            : null;
          if (authorUrl) {
            const author = (await lookupObject(authorUrl, {
              documentLoader,
            })) as Actor;

            if (author) {
              // Extract custom emojis from post
              const postTags: unknown[] = [];
              for await (const tag of note.getTags()) {
                postTags.push(tag);
              }
              const postEmojis = await extractCustomEmojis(postTags);

              // Extract custom emojis from author
              const authorTags: unknown[] = [];
              for await (const tag of author.getTags()) {
                authorTags.push(tag);
              }
              const authorEmojis = await extractCustomEmojis(authorTags);

              // Get author icon
              const icon = await author.getIcon({ documentLoader });

              posts.push({
                post: {
                  id: note.id?.toString(),
                  content: note.content,
                  published: note.published
                    ? new Date(note.published.toString()).toISOString()
                    : undefined,
                  url: note.url?.toString(),
                  emojis: postEmojis,
                },
                author: {
                  id: author.id?.toString(),
                  name: author.name,
                  preferredUsername: author.preferredUsername,
                  url: author.url?.toString(),
                  avatarUrl: icon?.url?.toString(),
                  emojis: authorEmojis,
                },
              });
            }
          }
        }
      } catch (error) {
        console.warn(
          `Failed to fetch ActivityPub object for ${mastodonPost.url}:`,
          error,
        );
        // If Fedify fails, we could fall back to using the Mastodon data directly
        // but for now, we'll just skip this post
        continue;
      }
    }

    return {
      posts,
      totalFound: posts.length,
      hashtag,
      searchMethod: "mastodon-search",
    };
  } catch (error) {
    console.warn("Failed to search hashtag with Mastodon API:", error);
    return null;
  }
}

/**
 * Search for posts containing a hashtag and return individual post promises for streaming
 *
 * @param hashtag The hashtag to search for (without #)
 * @param server Optional server parameter (ignored - we always use floss.social for search)
 * @returns Search metadata and array of post promises that resolve individually
 */
export async function searchHashtagStreaming(
  hashtag: string,
  server?: string,
): Promise<{
  postPromises: Promise<{ post: SimplePost; author: SimpleActor } | null>[];
  totalFound: number;
  hashtag: string;
  server?: string;
  searchMethod?: "mastodon-search" | "not-supported";
  error?: string;
}> {
  try {
    const accessToken = process.env.MASTODON_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        postPromises: [],
        totalFound: 0,
        hashtag,
        server,
        searchMethod: "not-supported",
        error: "MASTODON_ACCESS_TOKEN not configured",
      };
    }

    const searchUrl = "https://floss.social/api/v2/search";
    const searchQuery = `#${hashtag}`;

    const response = await fetch(
      `${searchUrl}?q=${encodeURIComponent(searchQuery)}&type=statuses&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      },
    );

    if (!response.ok) {
      console.warn(
        `Mastodon search failed: ${response.status} ${response.statusText}`,
      );
      return {
        postPromises: [],
        totalFound: 0,
        hashtag,
        server,
        searchMethod: "not-supported",
        error: "Search API failed",
      };
    }

    const searchResult: MastodonSearchResponse = await response.json();

    if (!searchResult.statuses || searchResult.statuses.length === 0) {
      return {
        postPromises: [],
        totalFound: 0,
        hashtag,
        searchMethod: "mastodon-search",
      };
    }

    // Create individual promises for each post - they'll resolve independently
    const { documentLoader } = context;
    const postPromises = searchResult.statuses.map(async (mastodonPost) => {
      try {
        // Use the ActivityPub URI (not the web URL) for better federation compatibility
        const activityPubUrl = mastodonPost.uri || mastodonPost.url;

        // Fetch the post using Fedify
        const note = (await lookupObject(activityPubUrl, {
          documentLoader,
        })) as Note;

        if (note instanceof Note) {
          // Get the author from the note's attribution
          const attributions = await note.getAttribution({ documentLoader });
          const authorUrl = attributions
            ? Array.isArray(attributions)
              ? attributions[0]?.id?.toString()
              : attributions?.id?.toString()
            : null;
          if (authorUrl) {
            const author = (await lookupObject(authorUrl, {
              documentLoader,
            })) as Actor;

            if (author) {
              // Extract custom emojis from post
              const postTags: unknown[] = [];
              for await (const tag of note.getTags()) {
                postTags.push(tag);
              }
              const postEmojis = await extractCustomEmojis(postTags);

              // Extract custom emojis from author
              const authorTags: unknown[] = [];
              for await (const tag of author.getTags()) {
                authorTags.push(tag);
              }
              const authorEmojis = await extractCustomEmojis(authorTags);

              // Get author icon
              const icon = await author.getIcon({ documentLoader });

              return {
                post: {
                  id: note.id?.toString(),
                  content: note.content,
                  published: note.published
                    ? new Date(note.published.toString()).toISOString()
                    : undefined,
                  url: note.url?.toString(),
                  emojis: postEmojis,
                },
                author: {
                  id: author.id?.toString(),
                  name: author.name,
                  preferredUsername: author.preferredUsername,
                  url: author.url?.toString(),
                  avatarUrl: icon?.url?.toString(),
                  emojis: authorEmojis,
                },
              };
            }
          }
        }
      } catch (error) {
        console.warn(
          `Failed to fetch ActivityPub object for ${mastodonPost.url}:`,
          error,
        );
        // Return null for failed posts
        return null;
      }
      return null;
    });

    return {
      postPromises,
      totalFound: searchResult.statuses.length,
      hashtag,
      searchMethod: "mastodon-search",
    };
  } catch (error) {
    console.warn("Failed to search hashtag with Mastodon API:", error);
    return {
      postPromises: [],
      totalFound: 0,
      hashtag,
      server,
      searchMethod: "not-supported",
      error: "Search failed",
    };
  }
}

/**
 * Search for posts containing a hashtag
 *
 * @param hashtag The hashtag to search for (without #)
 * @param server Optional server parameter (ignored - we always use floss.social for search)
 * @returns Search results
 */
export async function searchHashtag(
  hashtag: string,
  server?: string,
): Promise<HashtagSearchResult> {
  // Always use Mastodon search API via floss.social, regardless of server parameter
  const mastodonResult = await searchMastodonHashtag(hashtag);
  if (mastodonResult) {
    return mastodonResult;
  }

  return {
    posts: [],
    totalFound: 0,
    hashtag,
    server,
    searchMethod: "not-supported",
    error: `Unable to search for hashtag posts. Make sure MASTODON_ACCESS_TOKEN is configured.`,
  };
}

/**
 * Extract hashtags from a post's content
 *
 * @param content The post content (HTML or plain text)
 * @returns Array of hashtags found (without #)
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);

  if (!matches) return [];

  return matches.map((match) => match.slice(1).toLowerCase());
}
