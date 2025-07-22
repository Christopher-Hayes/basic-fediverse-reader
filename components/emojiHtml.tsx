"use client";

import React from "react";
import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
  Text,
  domToReact,
} from "html-react-parser";
import type { CustomEmoji } from "@/util/emoji";

interface EmojiHtmlProps {
  html: string;
  emojis?: CustomEmoji[];
  className?: string;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// How to render a hashtag/link with hover highlight effect
function Link({
  children,
  linkText,
  href,
}: {
  children: React.ReactNode;
  linkText: string;
  href: string;
}) {
  const HIGHLIGHT_PATH_LENGTH = 708;

  return (
    <span className="max-w-full group/link relative inline-flex">
      <svg
        className="absolute z-10 -top-1.5 -left-2.5 pointer-events-none text-bg-lighter group-hover/link:text-highlight group-focus-within/link:text-highlight group-hover/link:z-20 group-focus-within/link:z-10 transform scale-y-110"
        xmlns="http://www.w3.org/2000/svg"
        width={HIGHLIGHT_PATH_LENGTH}
        height="34.619"
        viewBox="0 0 187.198 9.16"
      >
        <path
          d="M18.877-185.064c.754.49 1.4-.202 2.106-.214 3.555-.06 7.157-.206 10.712.007.77.046 1.503.223 2.27.287 1.38.115 2.784.2 4.169.274 1.677.09 3.286-.064 4.96-.08 3.756-.036 7.506.19 11.267.107 1.568-.035 3.133-.137 4.703-.154 2.839-.03 5.687.031 8.524-.06 4.144-.133 8.26-.734 12.407-.836 2.755-.067 5.518.093 8.267.214 2.783.124 5.604-.008 8.39.027 2.44.03 4.88.31 7.313.461 3.304.205 6.642.317 9.951.408 2.209.061 4.407 0 6.614.007 3.557.012 7.123.037 10.68-.046 1.713-.04 3.411-.184 5.126-.194 1.998-.013 3.963-.202 5.956-.295 2.764-.128 5.523-.176 8.288-.254 1.4-.039 2.8-.147 4.2-.147 2.166 0 4.329.209 6.491.261.456.011.985-.196 1.438-.24 1.4-.139 2.8-.29 4.2-.422 2.375-.223 4.797-.25 7.18-.394 1.56-.094 3.117-.241 4.683-.26 1.567-.02 3.135.06 4.703.046.773-.007 1.567-.057 2.342-.007.126.008.222.128.339.134.486.026.968.136 1.458.147 1.929.044 3.834.194 5.761.32 1.529.1 3.04.22 4.56.375.197.02.935-.023 1.037.107.043.054-.459.03-.914.026"
          style={{
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 7.14375,
            strokeLinecap: "round",
            strokeDasharray: `${HIGHLIGHT_PATH_LENGTH}px`,
            strokeDashoffset: `${
              HIGHLIGHT_PATH_LENGTH - linkText.length * 3.3
            }px`,
            strokeOpacity: 1,
            paintOrder: "fill markers stroke",
          }}
          transform="translate(-15.306 190.183)"
        />
      </svg>
      <a
        className="relative px-0.5 z-20 group-hover/link:z-30 group-focus-within/link:z-30 max-w-full inline-block truncate focus-within:underline decoration-2 underline-offset-4 outline-none"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="relative">{children}</span>
      </a>
    </span>
  );
}

/**
 * Client component that replaces emoji shortcodes in HTML with images
 * and adds hashtag hover highlights
 */
export default function EmojiHtml({
  html,
  emojis = [],
  className,
}: EmojiHtmlProps) {
  // Process the HTML to replace emoji shortcodes with images
  let processedHtml = html;

  if (emojis && emojis.length > 0) {
    emojis.forEach((emoji) => {
      const imgTag = `<img src="${emoji.url}" alt="${emoji.name}" title="${emoji.name}" class="inline-emoji" style="display: inline; height: 1.2em; width: auto; vertical-align: text-top; margin: 0 0.1em;" loading="lazy" />`;
      processedHtml = processedHtml.replace(
        new RegExp(escapeRegExp(emoji.name), "g"),
        imgTag,
      );
    });
  }

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

        return (
          <Link key={index} href={attribs.href} linkText={linkText}>
            {domToReact(children as DOMNode[], options)}
          </Link>
        );
      }
    } else if (domNode instanceof Text) {
      // Need to wrap text nodes to ensure they show above the background highlights
      return <span className="relative z-20">{domNode.data}</span>;
    }
  };

  return <div className={className}>{parse(processedHtml, options)}</div>;
}
