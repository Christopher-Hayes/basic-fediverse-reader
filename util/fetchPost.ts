"use server";
import { lookupObject } from "@fedify/fedify";
import { context, INSTANCE_ACTOR } from "./federation";
import {
  type Link,
  Object as ASObject,
  type PropertyValue,
  Person,
  Note,
  Actor,
  Create,
} from "@fedify/fedify/vocab";
import fs from "fs";
import { extractCustomEmojis, type CustomEmoji } from "./emoji";

// Simple types for the card component
export type SimplePost = {
  id?: string;
  content?: unknown;
  published?: string; // ISO string for consistent JSON serialization
  url?: string;
  emojis?: CustomEmoji[];
};

export type SimpleActor = {
  id?: string;
  name?: unknown;
  preferredUsername?: unknown;
  url?: string;
  avatarUrl?: string;
  emojis?: CustomEmoji[];
};

// Convert Fedify objects to simple types for serialization
async function convertToSimpleTypes(
  posts: Array<{ post: Note; author: Actor }>,
): Promise<Array<{ post: SimplePost; author: SimpleActor }>> {
  const convertedPosts = await Promise.all(
    posts.map(async ({ post, author }) => {
      // Fetch the author's icon/avatar
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

      return {
        post: {
          id: post.id?.toString(),
          content: post.content,
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
      };
    }),
  );

  return convertedPosts;
}

const documentLoader = await context.getDocumentLoader({
  identifier: INSTANCE_ACTOR,
});

// Simple connectivity test for debugging server issues
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function testServerConnectivity(hostname: string): Promise<{
  reachable: boolean;
  error?: string;
}> {
  try {
    // Try a simple fetch to the server's wellknown endpoint
    const response = await fetch(`https://${hostname}/.well-known/nodeinfo`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return {
      reachable: response.status < 500, // Any response under 500 means server is reachable
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check if a server is likely defederated by attempting to fetch server info
async function checkServerFederation(hostname: string): Promise<{
  isDefederated: boolean;
  serverInfo?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Try to fetch the server's nodeinfo to see if it's reachable
    const nodeInfoResponse = await fetch(
      `https://${hostname}/.well-known/nodeinfo`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!nodeInfoResponse.ok) {
      return {
        isDefederated: false,
        error: `Server returned ${nodeInfoResponse.status}`,
      };
    }

    const nodeInfoLinks = await nodeInfoResponse.json();
    const nodeInfoUrl = nodeInfoLinks?.links?.find(
      (link: { rel: string; href: string }) =>
        link.rel === "http://nodeinfo.diaspora.software/ns/schema/2.0" ||
        link.rel === "http://nodeinfo.diaspora.software/ns/schema/2.1",
    )?.href;

    if (!nodeInfoUrl) {
      return { isDefederated: false, error: "No nodeinfo URL found" };
    }

    // Fetch the actual nodeinfo
    const serverInfoResponse = await fetch(nodeInfoUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!serverInfoResponse.ok) {
      return {
        isDefederated: false,
        error: `Nodeinfo returned ${serverInfoResponse.status}`,
      };
    }

    const serverInfo = await serverInfoResponse.json();

    // Check if server has federation disabled or restricted
    const openRegistrations = serverInfo?.openRegistrations;
    const software = serverInfo?.software?.name?.toLowerCase();

    // mastodon.art is known for aggressive defederation
    if (hostname === "mastodon.art") {
      return {
        isDefederated: true,
        serverInfo,
        error:
          "mastodon.art is known for extensive defederation and likely blocks your server",
      };
    }

    // Check for signs of restricted federation
    if (software === "mastodon" && openRegistrations === false) {
      return {
        isDefederated: true,
        serverInfo,
        error:
          "This Mastodon server has closed registrations and may have restricted federation",
      };
    }

    return { isDefederated: false, serverInfo };
  } catch (error) {
    return {
      isDefederated: true,
      error: `Cannot reach server info: ${error instanceof Error ? error.message : "Unknown error"}. This may indicate defederation or blocking.`,
    };
  }
}

// Save locally for testing (and to avoid spamming servers)
// "Note" is ActivityPub speak for "Mastodon Post"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function saveNoteLocally(post: Note | null, author: Actor | null) {
  fs.writeFileSync(
    "post.json",
    JSON.stringify(
      {
        post: await post?.toJsonLd({ format: "expand" }),
        author: await author?.toJsonLd({ format: "expand" }),
      },
      null,
      2,
    ),
  );
}

// Use locally-saved post for testing
export async function fetchTestPost() {
  // read post.json for debugging
  try {
    const post = JSON.parse(fs.readFileSync("post.json", "utf8"));
    return {
      post: await Note.fromJsonLd(post.post),
      author: await Person.fromJsonLd(post.author),
    };
  } catch (error) {
    console.error(error);
    return {
      post: null,
      author: null,
    };
  }
}

// Fetch an ActivityPub "Note" (Mastodon Post) from the provided identifier
// Identifier can be a URL or a Fediverse username, but for this function should be a URL
export async function fetchPost(identifier: string) {
  // If the identifier is a URL, ensure it is a valid URL
  if (identifier.includes("/")) {
    if (!identifier.includes("://")) {
      // If the URL is missing the protocol, add the protocol
      identifier = `https://${identifier}`;
    }

    // elk.zone - remove the elk.zone/ prefix
    identifier = identifier.replace("elk.zone/", "");
    // Flipboard - remove trailing /0
    identifier = identifier.replace(/\/0$/, "");
  }

  try {
    console.log(`Fetching ActivityPub object: ${identifier}`);

    // Assume we're fetching a Note
    const post = (await lookupObject(identifier, {
      documentLoader,
    })) as Note | null;

    if (!post) {
      console.error(`No post found for identifier: ${identifier}`);
      throw new Error(`Post not found or not accessible`);
    }

    console.log(`Found post: ${post.id}`);

    const tags: (ASObject & Link)[] = [];
    const attachments: (ASObject & Link & PropertyValue)[] = [];

    // TODO: Remove
    if (post) {
      const tagsPromise = new Promise(async (resolve) => {
        for await (const tag of post.getTags()) {
          tags.push(tag as unknown as ASObject & Link);
        }
        resolve(tags);
      });

      const attachmentsPromise = new Promise(async (resolve) => {
        for await (const attachment of post.getAttachments()) {
          attachments.push(
            attachment as unknown as ASObject & Link & PropertyValue,
          );
        }
        resolve(attachments);
      });

      await Promise.all([tagsPromise, attachmentsPromise]);
    }

    // Fetch information about the user who posted the note
    let author: Actor | null = null;
    if (post?.id) {
      const serverDomain = post.id.hostname;
      if (post.id?.href.includes("/users/")) {
        const username = post.id.href.split("/users/")[1].split("/")[0];
        console.log(
          `Fetching author: https://${serverDomain}/users/${username}`,
        );
        // Assume we are fetching an Actor
        author = (await lookupObject(
          `https://${serverDomain}/users/${username}`,
          {
            documentLoader,
          },
        )) as Actor | null;
      }
    }

    if (!author) {
      console.error(`No author found for post: ${identifier}`);
      throw new Error(`Author information not accessible`);
    }

    console.log(`Found author: ${author.name || author.preferredUsername}`);

    // Uncomment to save this post (and author) locally in post.json
    // saveNoteLocally(post, author);

    return {
      post,
      author,
    };
  } catch (error) {
    console.error(`Error fetching post ${identifier}:`, error);

    // Try to determine the specific cause of the error
    let hostname = "unknown";
    try {
      hostname = identifier.includes("://")
        ? new URL(identifier).hostname
        : identifier.split("/")[0];
    } catch {
      // hostname parsing failed, keep as "unknown"
    }

    // For network errors, check if the server is defederated
    if (
      error instanceof Error &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      try {
        console.log(`Checking federation status for ${hostname}...`);
        const federationCheck = await checkServerFederation(hostname);

        if (federationCheck.isDefederated) {
          throw new Error(
            `Defederation detected: ${federationCheck.error || `${hostname} appears to be defederated or blocking federation requests`}`,
          );
        }

        // If not defederated, continue with regular connectivity test
        const connectivity = await testServerConnectivity(hostname);
        if (!connectivity.reachable) {
          if (connectivity.error?.includes("ENOTFOUND")) {
            throw new Error(
              `Server not found: Cannot resolve ${hostname}. The domain may not exist.`,
            );
          }
          if (connectivity.error?.includes("ECONNREFUSED")) {
            throw new Error(
              `Connection refused: ${hostname} is actively refusing connections. The server may be blocking your IP or federation in general.`,
            );
          }
          if (connectivity.error?.includes("timeout")) {
            throw new Error(
              `Connection timeout: ${hostname} is not responding. This often indicates the server is blocking requests.`,
            );
          }
          throw new Error(
            `Network error: Cannot connect to ${hostname}. Error: ${connectivity.error || "Unknown connection issue"}`,
          );
        }
      } catch (defederationError) {
        // If this is our custom defederation error, re-throw it
        if (
          defederationError instanceof Error &&
          defederationError.message.includes("Defederation detected")
        ) {
          throw defederationError;
        }
        // Otherwise, fall through to original error handling
        console.warn("Federation check failed:", defederationError);
      }
    }

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      // Check for common federation errors
      if (
        error.message.includes("fetch") &&
        error.message.includes("ENOTFOUND")
      ) {
        throw new Error(
          `Server not found: Unable to resolve ${hostname}. The domain may not exist or DNS lookup failed.`,
        );
      }
      if (
        error.message.includes("fetch") &&
        error.message.includes("ECONNREFUSED")
      ) {
        throw new Error(
          `Connection refused: ${hostname} is not accepting connections. The server may be down or blocking requests.`,
        );
      }
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        throw new Error(
          `Access forbidden: ${hostname} is blocking federation requests`,
        );
      }
      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        throw new Error(
          `Post not found: The post may have been deleted or is not publicly accessible on ${hostname}`,
        );
      }
      if (error.message.includes("timeout")) {
        throw new Error(
          `Request timeout: ${hostname} took too long to respond`,
        );
      }
    }

    // Re-throw the original error with additional context
    throw new Error(
      `Failed to fetch from ${hostname}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Fetch recent posts from a user's outbox
export async function fetchUserPosts(
  handle: string,
  limit: number = 3,
): Promise<Array<{ post: SimplePost; author: SimpleActor }>> {
  try {
    // Parse the handle @username@server.com
    const match = handle.match(/@([^@]+)@(.+)/);
    if (!match) {
      console.error("Invalid handle format");
      return [];
    }

    // Look up the actor using the handle
    const actor = (await lookupObject(handle, {
      documentLoader,
    })) as Actor | null;

    if (!actor) {
      console.error("Could not fetch user");
      return [];
    }

    console.log(`Found actor: ${actor.name?.toString()} (${handle})`);

    // Get the actor's outbox
    const outbox = await actor.getOutbox({ documentLoader });
    if (!outbox) {
      console.error("Could not fetch outbox");
      return [];
    }

    console.log(`Found outbox, traversing for recent posts...`);

    // Traverse the outbox collection to get recent posts
    const posts: Array<{ post: Note; author: Actor }> = [];
    let count = 0;

    for await (const activity of context.traverseCollection(outbox, {
      documentLoader,
    })) {
      if (count >= limit) break;

      // We're looking for Create activities that contain Note objects
      if (activity instanceof Create) {
        try {
          const note = await (activity as Create).getObject({ documentLoader });

          if (note instanceof Note) {
            posts.push({
              post: note,
              author: actor,
            });
            count++;
            console.log(
              `Found post ${count}: ${note.content?.toString()?.substring(0, 50)}...`,
            );
          }
        } catch (error) {
          console.warn("Error processing activity:", error);
          continue;
        }
      }
    }

    console.log(`Successfully fetched ${posts.length} posts from ${handle}`);
    return await convertToSimpleTypes(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}
