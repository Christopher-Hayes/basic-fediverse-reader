import { fetchPost } from "@/util/fetchPost";
import { Document as ASDocument } from "@fedify/fedify/vocab";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postUrl: string[] }> }
) {
  const postUrl = decodeURIComponent((await params).postUrl.join("/")).replace(
    "https:/",
    "https://"
  );

  // Get real data
  const { post, author } = await fetchPost(postUrl);
  // Use local test data
  // const { post, author } = await fetchTestPost();

  const images = [];

  if (post?.getAttachments) {
    for await (const attachment of post?.getAttachments()) {
      if (attachment) {
        if (
          attachment instanceof ASDocument &&
          attachment.mediaType?.startsWith("image")
        ) {
          images.push(attachment);
        }
      }
    }
  }

  const contentHtml = post?.content?.toString() ?? "";

  return new Response(JSON.stringify({ images, post, author, contentHtml }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
