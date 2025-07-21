"use client";

import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
  Text,
  domToReact,
} from "html-react-parser";
import { Temporal } from "@js-temporal/polyfill";
import { timeSince } from "@/util/helpers";
import Image from "next/image";

// Simple types for the card component
type SimplePost = {
  id?: string; // Use string instead of URL to avoid serialization issues
  content?: unknown;
  published?: Date;
  url?: string; // Use string instead of URL to avoid serialization issues
};

type SimpleActor = {
  id?: string; // Use string instead of URL to avoid serialization issues
  name?: unknown;
  preferredUsername?: unknown;
  url?: string; // Use string instead of URL to avoid serialization issues
  avatarUrl?: string; // Pre-resolved avatar URL instead of async function
};

// Simplified link component for cards
function CardLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      className="text-amber-700 hover:text-amber-900 focus:text-amber-900 underline decoration-1 underline-offset-2 outline-none"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

// Condensed toot card component for displaying in lists
export default function TootCard({
  post,
  author,
}: {
  post: SimplePost;
  author: SimpleActor;
}) {
  const now = Temporal.Now.instant();
  const timeSinceString = post.published
    ? timeSince(
        Temporal.Duration.from(
          now.since(
            Temporal.Instant.fromEpochMilliseconds(post.published.getTime()),
          ),
        ),
      )
    : "Some time ago";

  const username = `@${author.preferredUsername?.toString()}`;
  const server = typeof author.url === "string" ? new URL(author.url).host : "";
  const fullIdentifier = `${username}@${server}`;

  // Options for parsing HTML content with simplified styling
  const options: HTMLReactParserOptions = {};
  options.replace = (domNode: DOMNode, index: number) => {
    if (domNode instanceof Element) {
      const { attribs, tagName, children } = domNode;

      if (attribs && tagName === "a") {
        return (
          <CardLink key={index} href={attribs.href}>
            {domToReact(children as DOMNode[], options)}
          </CardLink>
        );
      } else if (tagName === "p") {
        return (
          <p className="mb-2 text-sm leading-relaxed">
            {domToReact(children as DOMNode[], options)}
          </p>
        );
      }
    } else if (domNode instanceof Text) {
      return <span>{domNode.data}</span>;
    }
  };

  const contentHtml = post?.content?.toString() ?? "";
  const contentsReact = parse(contentHtml, options);

  // Generate the correct URL format for the post route
  // Convert https://floss.social/@chris/111234567890123456 to floss.social/@chris/111234567890123456
  const generatePostUrl = (url: string | undefined) => {
    if (!url) {
      return "";
    }

    try {
      // Ensure we have a proper URL object
      const postUrl = new URL(url);

      // Remove the protocol and construct the path
      const host = postUrl.host;
      const pathname = postUrl.pathname;

      // Format: /post/server/@username/postid
      return `/post/${host}${pathname}`;
    } catch (error) {
      console.error("Error generating post URL:", error, "from URL:", url);
      return "";
    }
  };

  return (
    <article className="bg-bg-lighter border border-bg-darker rounded-lg p-4 max-w-sm flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Author header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-darker flex-shrink-0">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={`${author.name?.toString() ?? "User"} avatar`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1">
            <a
              href={author.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fg hover:text-amber-700 focus:text-amber-700 outline-none truncate"
            >
              {author.name?.toString()}
            </a>
          </div>
          <p className="text-xs text-fg-muted truncate">{fullIdentifier}</p>
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-fg-muted hover:text-fg focus:text-fg outline-none flex-shrink-0"
        >
          {timeSinceString}
        </a>
      </div>

      {/* Content */}
      <div className="text-fg leading-relaxed overflow-hidden">
        <div className="relative max-h-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-lighter z-10 pointer-events-none"></div>
          {contentsReact}
        </div>
      </div>

      {/* View post link */}
      <div className="mt-auto pt-2 border-t border-bg-darker">
        <a
          href={generatePostUrl(post.url)}
          className="text-xs text-amber-700 hover:text-amber-900 focus:text-amber-900 hover:underline focus:underline outline-none"
        >
          View full post →
        </a>
      </div>
    </article>
  );
}
