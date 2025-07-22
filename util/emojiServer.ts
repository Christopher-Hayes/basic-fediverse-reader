"use server";

import { extractCustomEmojis, replaceCustomEmojis } from "./emoji";

/**
 * Process content with custom emojis for display - SERVER ACTION
 * @param content The HTML content to process
 * @param tags Array of tags from the ActivityPub object
 * @returns Processed content with custom emojis replaced
 */
export async function processCustomEmojis(
  content: string,
  tags: unknown[],
): Promise<string> {
  if (!tags || tags.length === 0) {
    return content;
  }

  try {
    const emojis = await extractCustomEmojis(tags);
    if (emojis.length === 0) {
      return content;
    }

    return replaceCustomEmojis(content, emojis, "inline-emoji");
  } catch (error) {
    console.warn("Error processing custom emojis:", error);
    return content; // Return original content if processing fails
  }
}
