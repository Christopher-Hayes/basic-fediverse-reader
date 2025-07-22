"use client";

import React from "react";
import type { CustomEmoji } from "@/util/emoji";

interface EmojiTextProps {
  text: string;
  emojis?: CustomEmoji[];
  className?: string;
}

/**
 * Client component that replaces emoji shortcodes with images
 */
export default function EmojiText({
  text,
  emojis = [],
  className,
}: EmojiTextProps) {
  if (!emojis || emojis.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Process the text to replace emoji shortcodes
  let processedContent: React.ReactNode[] = [text];

  emojis.forEach((emoji, emojiIndex) => {
    const newContent: React.ReactNode[] = [];

    processedContent.forEach((part, partIndex) => {
      if (typeof part === "string") {
        const parts = part.split(emoji.name);
        parts.forEach((textPart, textIndex) => {
          if (textIndex > 0) {
            // Add the emoji image
            newContent.push(
              <img
                key={`emoji-${emojiIndex}-${partIndex}-${textIndex}`}
                src={emoji.url}
                alt={emoji.name}
                title={emoji.name}
                className="inline-emoji"
                style={{
                  display: "inline",
                  height: "1.2rem",
                  width: "auto",
                  verticalAlign: "text-top",
                  margin: "0 0.1em",
                }}
                loading="lazy"
              />,
            );
          }
          if (textPart) {
            newContent.push(textPart);
          }
        });
      } else {
        newContent.push(part);
      }
    });

    processedContent = newContent;
  });

  return <span className={className}>{processedContent}</span>;
}

/**
 * Hook version for use in other components
 */
export function useEmojiReplacedText(
  text: string,
  emojis?: CustomEmoji[],
): React.ReactNode {
  if (!emojis || emojis.length === 0) {
    return text;
  }

  // Process the text to replace emoji shortcodes
  let processedContent: React.ReactNode[] = [text];

  emojis.forEach((emoji, emojiIndex) => {
    const newContent: React.ReactNode[] = [];

    processedContent.forEach((part, partIndex) => {
      if (typeof part === "string") {
        const parts = part.split(emoji.name);
        parts.forEach((textPart, textIndex) => {
          if (textIndex > 0) {
            // Add the emoji image
            newContent.push(
              <img
                key={`emoji-${emojiIndex}-${partIndex}-${textIndex}`}
                src={emoji.url}
                alt={emoji.name}
                title={emoji.name}
                className="inline-emoji"
                style={{
                  display: "inline",
                  height: "1.2rem",
                  width: "auto",
                  verticalAlign: "text-top",
                  margin: "0 0.1em",
                }}
                loading="lazy"
              />,
            );
          }
          if (textPart) {
            newContent.push(textPart);
          }
        });
      } else {
        newContent.push(part);
      }
    });

    processedContent = newContent;
  });

  return processedContent;
}
