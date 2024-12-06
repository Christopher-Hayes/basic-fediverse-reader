// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fetchPost, fetchTestPost } from "@/util/fetchPost";
import { Document as ASDocument, Group } from "@fedify/fedify/vocab";
import Toot from "@/components/toot";
import Nav from "@/components/nav";
import TootAuthor from "@/components/tootAuthor";
import Image from "next/image";
import ImageOverlay from "@/public/image-overlay.svg";
import classnames from "classnames";

export default async function Page({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params,
}: {
  params: Promise<{ postUrl: string[] }>;
}) {
  const postUrl = decodeURIComponent((await params).postUrl.join("/")).replace(
    "https:/",
    "https://"
  );

  // Get real data
  const { post, author } = await fetchPost(postUrl);
  // Use local test data
  // const { post, author } = await fetchTestPost();

  let contentHtml = post?.content?.toString() ?? "";

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

  return (
    <div
      className={classnames(
        "min-h-screen flex overflow-hidden gap-16",
        !!images.length ? "justify-normal" : "justify-center"
      )}
    >
      {contentHtml ? (
        <>
          {!!images.length && (
            <>
              {/* desktop */}
              <aside className="hidden sm:block absolute sm:relative z-0 min-h-screen w-full max-w-[40vw] overflow-hidden">
                <Image
                  src={images[0].url?.toString() ?? ""}
                  alt={images[0].name?.toString() ?? ""}
                  width={images[0].width ?? 600}
                  height={images[0].height ?? 800}
                  quality={90}
                  className="w-full h-full object-cover filter sepia brightness-95"
                />
                <ImageOverlay className="absolute z-10 text-bg -right-[33vh] -top-[3vh] h-[106vh] w-[45vh]" />
                <ImageOverlay className="absolute z-10 text-bg-darker -left-[33vh] -top-[3vh] h-[106vh] w-[45vh]" />
              </aside>
              <aside className="sm:hidden absolute sm:relative z-0 min-h-screen w-full overflow-hidden">
                <Image
                  src={images[0].url?.toString() ?? ""}
                  alt={images[0].name?.toString() ?? ""}
                  width={images[0].width ?? 600}
                  height={images[0].height ?? 800}
                  quality={90}
                  className="w-full min-h-screen object-cover filter grayscale contrast-75"
                />
              </aside>
            </>
          )}
          <main className="w-full max-w-[1000px] flex-grow flex justify-center min-h-screen bg-bg py-12 sm:py-16">
            <div className="h-full w-full max-w-2xl flex flex-col gap-8 items-center justify-center">
              <Nav />
              {post && (
                <>
                  <div className="w-full flex-grow flex flex-col justify-center pt-24 sm:pt-0">
                    <Toot contents={contentHtml} />
                  </div>
                  {author && (
                    <footer className="w-full">
                      <TootAuthor person={author} post={post} />
                    </footer>
                  )}
                </>
              )}
            </div>
          </main>
        </>
      ) : (
        <div className="px-8 pt-8 sm:pt-16 pb-32 sm:pb-48 min-h-screen flex flex-col gap-8">
          <Nav />
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl">Sorry!</h1>
            <h2>Unable to fetch post.</h2>
            <p>
              Post URL:{" "}
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-muted underline"
              >
                {postUrl}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
