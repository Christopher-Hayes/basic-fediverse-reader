"use client";

import React from "react";
import parse from "html-react-parser";
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

/**
 * Client component that replaces emoji shortcodes in HTML with images
 */
export default function EmojiHtml({
  html,
  emojis = [],
  className,
}: EmojiHtmlProps) {
  if (!emojis || emojis.length === 0) {
    return <div className={className}>{parse(html)}</div>;
  }

  // Process the HTML to replace emoji shortcodes with images
  let processedHtml = html;

  emojis.forEach((emoji) => {
    const imgTag = `<img src="${emoji.url}" alt="${emoji.name}" title="${emoji.name}" class="inline-emoji" style="display: inline; height: 1.2em; width: auto; vertical-align: text-top; margin: 0 0.1em;" loading="lazy" />`;
    processedHtml = processedHtml.replace(
      new RegExp(escapeRegExp(emoji.name), "g"),
      imgTag,
    );
  });

  return <div className={className}>{parse(processedHtml)}</div>;
}
