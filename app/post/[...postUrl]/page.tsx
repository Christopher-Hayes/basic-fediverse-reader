import Nav from "@/components/nav";
import PostLoader from "@/components/postLoader";
import { fetchPostsData } from "@/lib/server-actions";

// Revalidate the page once per day (86400 seconds = 24 hours)
export const revalidate = 86400;

// Generate static params for the posts shown on homepage
export async function generateStaticParams() {
  try {
    // Fetch the same posts that are shown on the homepage
    const posts = await fetchPostsData("@chris@floss.social", 3);

    return posts
      .filter((postData) => postData.post.url) // Only include posts with URLs
      .map((postData) => {
        try {
          // Convert the post URL to the format expected by the route
          const url = new URL(postData.post.url!);
          const host = url.host;
          const pathname = url.pathname;

          // Remove leading slash and split into segments for [...postUrl]
          const postUrlSegments = `${host}${pathname}`
            .split("/")
            .filter(Boolean);

          return {
            postUrl: postUrlSegments,
          };
        } catch (error) {
          console.error("Error generating static params for post:", error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries from failed URL parsing
  } catch (error) {
    console.error("Error fetching posts for static generation:", error);
    return []; // Return empty array if fetching fails
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ postUrl: string[] }>;
}) {
  const postUrl = decodeURIComponent((await params).postUrl.join("/")).replace(
    "https:/",
    "https://",
  );

  return (
    <div className="min-h-screen">
      <div className="absolute top-0 left-0 right-0 z-50 px-8 pt-8">
        <Nav />
      </div>
      <PostLoader postUrl={postUrl} />
    </div>
  );
}
