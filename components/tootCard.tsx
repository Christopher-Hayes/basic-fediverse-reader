"use client";

import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
  Text,
  domToReact,
} from "html-react-parser";
import { Temporal } from "@js-temporal/polyfill";
import { timeSince, convertMentionUrl } from "@/util/helpers";
import Image from "next/image";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import EmojiText from "@/components/emojiText";

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Simplified link component for cards
function CardLink({
  children,
  href,
  isHashtag = false,
}: {
  children: React.ReactNode;
  href: string;
  isHashtag?: boolean;
}) {
  return (
    <a
      className={`text-amber-700 hover:text-amber-900 focus:text-amber-900 underline decoration-1 underline-offset-2 outline-none ${
        isHashtag ? "" : "line-clamp-2"
      }`}
      href={href}
      target={href.startsWith("/") ? "_self" : "_blank"}
      rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
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

  // Options for parsing HTML content with simplified styling
  const options: HTMLReactParserOptions = {};
  options.replace = (domNode: DOMNode, index: number) => {
    if (domNode instanceof Element) {
      const { attribs, tagName, children } = domNode;

      if (attribs && tagName === "a") {
        // Recursively get innerText on children to compute the length of the text
        let linkText = "";

        const getInnerText = (children: DOMNode[]) => {
          for (const child of children) {
            if (child instanceof Text) {
              linkText += child.data;
            } else if (child instanceof Element) {
              getInnerText(child.children as DOMNode[]);
            }
          }
        };

        getInnerText(children as DOMNode[]);

        // Check if this is a hashtag link
        const isHashtag = linkText.startsWith("#");
        let finalHref = attribs.href;

        if (isHashtag) {
          const hashtagText = encodeURIComponent(linkText.slice(1)); // Remove # and encode
          finalHref = server
            ? `/hashtag/${hashtagText}?server=${encodeURIComponent(server)}`
            : `/hashtag/${hashtagText}`;
        } else {
          // Check if this is a mention link and convert to internal profile link
          finalHref = convertMentionUrl(attribs.href, linkText, attribs.class);
        }

        return (
          <CardLink key={index} href={finalHref} isHashtag={isHashtag}>
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

  let contentHtml = post?.content?.toString() ?? "";

  // Process emojis in content if available
  if (post.emojis && post.emojis.length > 0) {
    post.emojis.forEach((emoji) => {
      const imgTag = `<img src="${emoji.url}" alt="${emoji.name}" title="${emoji.name}" class="inline-emoji" style="display: inline; height: 1.2em; width: auto; vertical-align: text-top; margin: 0 0.1em;" loading="lazy" />`;
      contentHtml = contentHtml.replace(
        new RegExp(escapeRegExp(emoji.name), "g"),
        imgTag,
      );
    });
  }

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
      <div className="flex items-center gap-1">
        {author.avatarUrl ? (
          <Image
            src={author.avatarUrl}
            alt={`${author.name?.toString() ?? "User"} avatar`}
            width={64}
            height={64}
            className="object-contain pfp filter grayscale sm:grayscale-0 sm:sepia flex-shrink-0 transform scale-75"
            style={{
              clipPath: "url(#avatarClipPath)",
            }}
          />
        ) : (
          <div
            className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0"
            style={{ clipPath: "url(#avatarClipPath)" }}
          ></div>
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1">
            <a
              href={`/profile/${encodeURIComponent(fullIdentifier)}`}
              className="font-medium text-fg hover:text-amber-700 focus:text-amber-700 outline-none truncate"
            >
              <EmojiText
                text={author.name?.toString() || ""}
                emojis={author.emojis}
              />
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
          Read toot →
        </a>
      </div>
    </article>
  );
}
