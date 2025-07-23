"use client";

import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
  Text,
  domToReact,
} from "html-react-parser";
import { convertMentionUrl } from "@/util/helpers";
import Image from "next/image";
import Link from "next/link";
import type { SimplePost, SimpleActor } from "@/util/fetchPost";
import EmojiText from "@/components/emojiText";
import TimeSince from "@/components/timeSince";

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Full content link component
function FullCardLink({
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

// Full post card component for displaying complete posts in profile
export default function TootCardFull({
  post,
  author,
}: {
  post: SimplePost;
  author: SimpleActor;
}) {
  const username = `@${author.preferredUsername?.toString()}`;
  const server = typeof author.url === "string" ? new URL(author.url).host : "";
  const fullIdentifier = `${username}@${server}`;

  // Options for parsing HTML content with full styling
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
          <FullCardLink key={index} href={finalHref} isHashtag={isHashtag}>
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
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0">
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
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 pfp"></div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${encodeURIComponent(fullIdentifier)}`}
              className="font-semibold text-fg hover:text-amber-700 focus:text-amber-700 outline-none truncate"
            >
              <EmojiText
                text={author.name?.toString() || ""}
                emojis={author.emojis}
              />
            </Link>
            <span className="text-fg-muted">·</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-fg-muted hover:text-fg focus:text-fg outline-none flex-shrink-0"
            >
              <TimeSince publishedDate={post.published} />
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
          Read toot →
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
