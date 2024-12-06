'use server'
import { useEffect, useState } from "react";
import { type Link, type Object as ASObject } from "@fedify/fedify/vocab";
import { DocumentLoader } from "@fedify/fedify";

export default function TagList({ getTags }: { getTags(options?: {
        documentLoader?: DocumentLoader;
        contextLoader?: DocumentLoader;
        suppressError?: boolean;
    }): AsyncIterable<ASObject | Link>
}) {
  const [tags, setTags] = useState<(ASObject & Link)[]>([]);

  useEffect(() => {
    (async () => {
      for await (const tag of getTags()) {
        setTags((tags) => [...tags, tag as unknown as ASObject & Link]);
      }
    })();
  }, [getTags, tags]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((tag) => (
        <p key={tag.id?.href ?? tag.name?.toString()}>{tag.name}</p>
      ))}
    </div>
  );
}
