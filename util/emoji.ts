import { Emoji } from "@fedify/fedify/vocab";

export interface CustomEmoji {
  id?: string;
  name: string; // The shortcode like ":archlinux:"
  url: string; // URL to the emoji image
  static_url?: string; // Optional static version
}

/**
 * Extract custom emojis from ActivityPub tags
 * @param tags Array of tags from a Note or Actor
 * @returns Array of custom emojis found in the tags
 */
export async function extractCustomEmojis(
  tags: unknown[],
): Promise<CustomEmoji[]> {
  const emojis: CustomEmoji[] = [];

  for (const tag of tags) {
    // Check if this tag is an Emoji type
    if (tag instanceof Emoji) {
      const name = tag.name?.toString();
      const icon = await tag.getIcon();
      const url = icon?.url?.toString();

      if (name && url) {
        emojis.push({
          id: tag.id?.toString(),
          name,
          url,
          static_url: url, // Assume static URL is the same unless we have better info
        });
      }
    }
  }

  return emojis;
}

/**
 * Replace custom emoji shortcodes in text with HTML img tags
 * @param text The text content to process
 * @param emojis Array of custom emojis to replace
 * @param className Optional CSS class for the img tags
 * @returns Text with emoji shortcodes replaced by img tags
 */
export function replaceCustomEmojis(
  text: string,
  emojis: CustomEmoji[],
  className = "inline-emoji",
): string {
  let processedText = text;

  for (const emoji of emojis) {
    // Replace all instances of the emoji shortcode with an img tag
    const shortcode = emoji.name;
    const imgTag = `<img src="${emoji.url}" alt="${shortcode}" title="${shortcode}" class="${className}" style="display: inline; height: 1.2em; width: auto; vertical-align: text-top; margin: 0 0.1em;" loading="lazy" />`;

    // Use a global replace to handle multiple instances of the same emoji
    processedText = processedText.replace(
      new RegExp(escapeRegExp(shortcode), "g"),
      imgTag,
    );
  }

  return processedText;
}

/**
 * Escape special regex characters in a string
 * @param string The string to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
