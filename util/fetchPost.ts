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
// Simple types for the card component
export type SimplePost = {
  id?: string;
  content?: unknown;
  published?: string; // ISO string for consistent JSON serialization
  url?: string;
};

export type SimpleActor = {
  id?: string;
  name?: unknown;
  preferredUsername?: unknown;
  url?: string;
  avatarUrl?: string;
};

// Convert Fedify objects to simple types for serialization
async function convertToSimpleTypes(
  posts: Array<{ post: Note; author: Actor }>,
): Promise<Array<{ post: SimplePost; author: SimpleActor }>> {
  const convertedPosts = await Promise.all(
    posts.map(async ({ post, author }) => {
      // Fetch the author's icon/avatar
      const icon = await author.getIcon({ documentLoader });

      return {
        post: {
          id: post.id?.toString(),
          content: post.content,
          published: post.published
            ? new Date(post.published.toString()).toISOString()
            : undefined,
          url: post.url?.toString(),
        },
        author: {
          id: author.id?.toString(),
          name: author.name,
          preferredUsername: author.preferredUsername,
          url: author.url?.toString(),
          avatarUrl: icon?.url?.toString(),
        },
      };
    }),
  );

  return convertedPosts;
}

const documentLoader = await context.getDocumentLoader({
  identifier: INSTANCE_ACTOR,
});

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
    // Assume we're fetching a Note
    const post = (await lookupObject(identifier, {
      documentLoader,
    })) as Note | null;

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
        // Assume we are fetching an Actor
        author = (await lookupObject(
          `https://${serverDomain}/users/${username}`,
          {
            documentLoader,
          },
        )) as Actor | null;
      }
    }

    // Uncomment to save this post (and author) locally in post.json
    // saveNoteLocally(post, author);

    return {
      post,
      author,
    };
  } catch (error) {
    console.error(error);
    return {
      post: null,
      author: null,
    };
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
