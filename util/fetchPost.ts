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
} from "@fedify/fedify/vocab";
import fs from "fs";

const documentLoader = await context.getDocumentLoader({
  identifier: INSTANCE_ACTOR,
});

// Save locally for testing (and to avoid spamming servers)
// "Note" is ActivityPub speak for "Mastodon Post"
async function saveNoteLocally(post: Note | null, author: Actor | null) {
  fs.writeFileSync(
    "post.json",
    JSON.stringify(
      {
        post: await post?.toJsonLd({ format: "expand" }),
        author: await author?.toJsonLd({ format: "expand" }),
      },
      null,
      2
    )
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
            attachment as unknown as ASObject & Link & PropertyValue
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
          }
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
