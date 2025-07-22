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
import Link from "next/link";

// Simple types for the card component
type SimplePost = {
  id?: string;
  content?: unknown;
  published?: string; // ISO string for consistent JSON serialization
  url?: string;
};

type SimpleActor = {
  id?: string;
  name?: unknown;
  preferredUsername?: unknown;
  url?: string;
  avatarUrl?: string;
};

// Full content link component
function FullCardLink({
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

// Full post card component for displaying complete posts in profile
export default function TootCardFull({
  post,
  author,
}: {
  post: SimplePost;
  author: SimpleActor;
}) {
  const now = Temporal.Now.instant();

  // Handle ISO string dates
  const publishedTimestamp = post.published
    ? new Date(post.published).getTime()
    : null;
  const timeSinceString = publishedTimestamp
    ? timeSince(
        Temporal.Duration.from(
          now.since(Temporal.Instant.fromEpochMilliseconds(publishedTimestamp)),
        ),
      )
    : "Some time ago";

  const username = `@${author.preferredUsername?.toString()}`;
  const server = typeof author.url === "string" ? new URL(author.url).host : "";
  const fullIdentifier = `${username}@${server}`;

  // Options for parsing HTML content with full styling
  const options: HTMLReactParserOptions = {};
  options.replace = (domNode: DOMNode, index: number) => {
    if (domNode instanceof Element) {
      const { attribs, tagName, children } = domNode;

      if (attribs && tagName === "a") {
        return (
          <FullCardLink key={index} href={attribs.href}>
            {domToReact(children as DOMNode[], options)}
          </FullCardLink>
        );
      } else if (tagName === "p") {
        return (
          <p key={index} className="mb-3 leading-relaxed">
            {domToReact(children as DOMNode[], options)}
          </p>
        );
      } else if (tagName === "br") {
        return <br key={index} />;
      }
    } else if (domNode instanceof Text) {
      return <span>{domNode.data}</span>;
    }
  };

  const contentHtml = post?.content?.toString() ?? "";
  const contentsReact = parse(contentHtml, options);

  // Generate the correct URL format for the post route
  const generatePostUrl = (url: string | undefined) => {
    if (!url) {
      return "";
    }

    try {
      const postUrl = new URL(url);
      const host = postUrl.host;
      const pathname = postUrl.pathname;
      return `/post/${host}${pathname}`;
    } catch (error) {
      console.error("Error generating post URL:", error, "from URL:", url);
      return "";
    }
  };

  return (
    <article className="bg-bg-lighter border-2 border-bg-darker rounded-lg p-6 break-inside-avoid mb-6 hover:shadow-lg transition-all duration-200 hover:border-highlight">
      {/* Author header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-darker flex-shrink-0">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={`${author.name?.toString() ?? "User"} avatar`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${encodeURIComponent(fullIdentifier)}`}
              className="font-semibold text-fg hover:text-amber-700 focus:text-amber-700 outline-none truncate"
            >
              {author.name?.toString()}
            </Link>
            <span className="text-fg-muted">·</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-fg-muted hover:text-fg focus:text-fg outline-none flex-shrink-0"
            >
              {timeSinceString}
            </a>
          </div>
          <p className="text-sm text-fg-muted truncate">{fullIdentifier}</p>
        </div>
      </div>

      {/* Full Content */}
      <div className="text-fg leading-relaxed mb-4">{contentsReact}</div>

      {/* Action footer */}
      <div className="pt-3 border-t border-bg-darker flex justify-between items-center">
        <Link
          href={generatePostUrl(post.url)}
          className="text-sm text-amber-700 hover:text-amber-900 focus:text-amber-900 hover:underline focus:underline outline-none"
        >
          View detailed post →
        </Link>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fg-muted hover:text-fg focus:text-fg outline-none"
          >
            View on {server}
          </a>
        )}
      </div>
    </article>
  );
}
