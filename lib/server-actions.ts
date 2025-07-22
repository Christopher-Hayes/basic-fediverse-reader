"use server";

import { lookupObject } from "@fedify/fedify";
import { context, INSTANCE_ACTOR } from "@/util/federation";
import { Actor } from "@fedify/fedify/vocab";
import { fetchUserPosts } from "@/util/fetchPost";
import { fetchPost } from "@/util/fetchPost";
import type { SimpleActorProfile } from "@/components/profileHeader";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import { extractCustomEmojis } from "@/util/emoji";

// Get document loader for ActivityPub operations
const getDocumentLoader = async () => {
  return await context.getDocumentLoader({
    identifier: INSTANCE_ACTOR,
  });
};

// Server action to fetch profile data
export async function fetchProfileData(
  handle: string,
): Promise<SimpleActorProfile | null> {
  try {
    // Parse different handle formats
    let processedHandle = handle;
    if (!handle.startsWith("@")) {
      processedHandle = `@${handle}`;
    }

    // Ensure handle has proper format @username@server.com
    const parts = processedHandle.split("@");
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      console.error("Invalid handle format. Expected: @username@server.com");
      return null;
    }

    const documentLoader = await getDocumentLoader();

    // Fetch the user/actor
    const actor = (await lookupObject(processedHandle, {
      documentLoader,
    })) as Actor | null;

    if (!actor) {
      console.error("Profile not found");
      return null;
    }

    // Get actor properties
    const icon = await actor.getIcon({ documentLoader });
    const summary = actor.summary;

    // Get additional actor metadata
    let followersCount: number | undefined;
    let followingCount: number | undefined;
    let outboxCount: number | undefined;
    let published: string | undefined;

    try {
      const followers = await actor.getFollowers({ documentLoader });
      if (followers && followers.totalItems !== null) {
        followersCount = followers.totalItems;
      }
    } catch (error) {
      console.warn(
        "Could not fetch followers count:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    try {
      const following = await actor.getFollowing({ documentLoader });
      if (following && following.totalItems !== null) {
        followingCount = following.totalItems;
      }
    } catch (error) {
      console.warn(
        "Could not fetch following count:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    try {
      const outbox = await actor.getOutbox({ documentLoader });
      if (outbox && outbox.totalItems !== null) {
        outboxCount = outbox.totalItems;
      }
    } catch (error) {
      console.warn(
        "Could not fetch outbox count:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    try {
      if (actor.published) {
        published = actor.published.toString();
      }
    } catch (error) {
      console.warn(
        "Could not fetch published date:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    // Extract custom emojis from actor tags
    const actorTags: unknown[] = [];
    for await (const tag of actor.getTags()) {
      actorTags.push(tag);
    }
    const actorEmojis = await extractCustomEmojis(actorTags);

    // Convert actor to simple type
    const simpleActor: SimpleActorProfile = {
      id: actor.id?.toString(),
      name: actor.name,
      preferredUsername: actor.preferredUsername,
      url: actor.url?.toString(),
      avatarUrl: icon?.url?.toString(),
      summary: summary?.toString(),
      emojis: actorEmojis,
      followersCount,
      followingCount,
      outboxCount,
      published,
    };

    return simpleActor;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// Server action to fetch posts data
export async function fetchPostsData(
  handle: string,
  limit: number = 6,
): Promise<Array<{ post: SimplePost; author: SimpleActor }>> {
  try {
    // Parse different handle formats
    let processedHandle = handle;
    if (!handle.startsWith("@")) {
      processedHandle = `@${handle}`;
    }

    // Fetch recent posts
    const recentPosts = await fetchUserPosts(processedHandle, limit);
    return recentPosts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Server action to fetch individual post data
export async function fetchPostData(postUrl: string): Promise<{
  post: SimplePost & { content?: string };
  author: SimpleActor;
  images?: Array<{
    url: string;
    name?: string;
    width?: number;
    height?: number;
  }>;
} | null> {
  try {
    const cleanPostUrl = decodeURIComponent(postUrl).replace(
      "https:/",
      "https://",
    );

    console.log(`Attempting to fetch post: ${cleanPostUrl}`);

    // Get real data
    const { post, author } = await fetchPost(cleanPostUrl);

    if (!post || !author) {
      console.error(`Failed to fetch post or author for: ${cleanPostUrl}`);
      throw new Error(
        `Unable to fetch post from ${new URL(cleanPostUrl).hostname}. This server may be blocking federation requests.`,
      );
    }

    console.log(`Successfully fetched post: ${post.id}`);

    const contentHtml = post?.content?.toString() ?? "";

    const images = [];

    if (post?.getAttachments) {
      const { Document: ASDocument } = await import("@fedify/fedify/vocab");

      for await (const attachment of post?.getAttachments()) {
        if (attachment) {
          if (
            attachment instanceof ASDocument &&
            attachment.mediaType?.startsWith("image")
          ) {
            images.push({
              url: attachment.url?.toString() ?? "",
              name: attachment.name?.toString() ?? "",
              width: attachment.width ?? 600,
              height: attachment.height ?? 800,
            });
          }
        }
      }
    }

    // Get document loader and author avatar
    const documentLoader = await getDocumentLoader();
    const icon = await author.getIcon({ documentLoader });

    // Extract custom emojis from post tags
    const postTags: unknown[] = [];
    for await (const tag of post.getTags()) {
      postTags.push(tag);
    }
    const postEmojis = await extractCustomEmojis(postTags);

    // Extract custom emojis from author tags
    const authorTags: unknown[] = [];
    for await (const tag of author.getTags()) {
      authorTags.push(tag);
    }
    const authorEmojis = await extractCustomEmojis(authorTags);

    const response = {
      post: {
        id: post.id?.toString(),
        content: contentHtml,
        published: post.published
          ? new Date(post.published.toString()).toISOString()
          : undefined,
        url: post.url?.toString(),
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
      images,
    };

    return response;
  } catch (error) {
    console.error("Error fetching post:", error);

    // Check if it's a network or federation error
    if (error instanceof Error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        throw new Error(
          `Network error: Unable to connect to ${postUrl.includes("://") ? new URL(postUrl).hostname : "server"}`,
        );
      }
      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        throw new Error(
          `Post not found: The post may have been deleted or is not publicly accessible`,
        );
      }
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        throw new Error(
          `Access denied: The server is blocking federation requests`,
        );
      }
      if (error.message.includes("blocking")) {
        throw error; // Re-throw our custom blocking message
      }
    }

    throw new Error(
      `Failed to fetch post: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
