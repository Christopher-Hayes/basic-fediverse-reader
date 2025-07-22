import { fetchPost } from "@/util/fetchPost";
import { Document as ASDocument } from "@fedify/fedify/vocab";
import { NextRequest, NextResponse } from "next/server";
import { context, INSTANCE_ACTOR } from "@/util/federation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postUrl: string[] }> },
) {
  try {
    const postUrl = decodeURIComponent(
      (await params).postUrl.join("/"),
    ).replace("https:/", "https://");

    // Get real data
    const { post, author } = await fetchPost(postUrl);

    if (!post || !author) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const contentHtml = post?.content?.toString() ?? "";

    const images = [];

    if (post?.getAttachments) {
      for await (const attachment of post?.getAttachments()) {
        if (attachment) {
          if (
            attachment instanceof ASDocument &&
            attachment.mediaType?.startsWith("image")
          ) {
            images.push({
              url: attachment.url?.toString() ?? "",
              name: attachment.name?.toString() ?? "",
              width: attachment.width ?? 600,
              height: attachment.height ?? 800,
            });
          }
        }
      }
    }

    // Get document loader and author avatar
    const documentLoader = await context.getDocumentLoader({
      identifier: INSTANCE_ACTOR,
    });
    const icon = await author.getIcon({ documentLoader });

    const response = {
      post: {
        id: post.id?.toString(),
        content: contentHtml,
        published: post.published
          ? new Date(post.published.toString()).toISOString()
          : undefined,
        url: post.url?.toString(),
      },
      author: {
        id: author.id?.toString(),
        name: author.name,
        preferredUsername: author.preferredUsername,
        url: author.url?.toString(),
        avatarUrl: icon?.url?.toString(),
      },
      images,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}
