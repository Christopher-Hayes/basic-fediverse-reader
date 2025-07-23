import { Temporal } from "@js-temporal/polyfill";

// URL processing types
export type ParsedUrl = {
  type: "profile" | "post";
  path: string;
  handle?: string; // For profile URLs, the @user@server.com format
};

// Parse fediverse URLs to determine if they're profile or post URLs
export function parseFediverseUrl(input: string): ParsedUrl | null {
  let url = input.trim();

  // Check if it's a fediverse handle format: @username@server.com
  const handlePattern = /^@?([^@\s]+)@([^@\s]+\.[^@\s]+)$/;
  const handleMatch = url.match(handlePattern);
  if (handleMatch) {
    const [, username, server] = handleMatch;
    return {
      type: "profile",
      path: `${username}@${server}`,
      handle: `@${username}@${server}`,
    };
  }

  // Remove protocol if present
  url = url.replace(/^https?:\/\//, "");

  // Handle elk.zone URLs
  url = url.replace(/^elk\.zone\//, "");

  // Handle Flipboard URLs - remove trailing /0
  url = url.replace(/\/0$/, "");

  // Check if it looks like a profile URL
  // Profile URLs typically have format: server.com/@username or server.com/users/username
  const profilePatterns = [
    /^([^\/]+)\/@([^\/]+)$/, // server.com/@username
    /^([^\/]+)\/users\/([^\/]+)$/, // server.com/users/username
    /^([^\/]+)\/profile\/([^\/]+)$/, // server.com/profile/username (some servers)
  ];

  for (const pattern of profilePatterns) {
    const match = url.match(pattern);
    if (match) {
      const [, server, username] = match;
      return {
        type: "profile",
        path: `${username}@${server}`,
        handle: `@${username}@${server}`,
      };
    }
  }

  // If it contains a long number or looks like a post ID, treat as post
  // Post URLs typically have format: server.com/@username/1234567890 or server.com/notes/abc123
  const postPatterns = [
    /\/\d{10,}/, // Contains a long numeric ID (typical of Mastodon posts)
    /\/notes\//, // Contains /notes/ path (typical of other ActivityPub servers)
    /\/status\//, // Contains /status/ path (Twitter-like format)
    /\/objects\//, // Contains /objects/ path (some ActivityPub implementations)
  ];

  for (const pattern of postPatterns) {
    if (pattern.test(url)) {
      return {
        type: "post",
        path: url,
      };
    }
  }

  // If we can't determine, default to post (existing behavior)
  return {
    type: "post",
    path: url,
  };
}

export function timeSince(duration: Temporal.Duration): string {
  const units: Temporal.SmallestUnit<Temporal.DateTimeUnit>[] = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
  ];
  const today = Temporal.Now.plainDateTimeISO();

  for (const unit of units) {
    const total = duration
      .round({
        smallestUnit: unit,
        relativeTo: today,
      })
      .total({
        unit,
        relativeTo: today,
      });
    const rounded = Math.floor(total);

    if (rounded >= 1) {
      return `${rounded} ${unit}${rounded !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

/**
 * Extract server domain from a fediverse URL
 * @param url The fediverse URL (post URL, profile URL, etc.)
 * @returns The server domain or null if not extractable
 */
export function extractServerFromUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}
