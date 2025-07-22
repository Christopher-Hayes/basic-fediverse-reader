import Nav from "@/components/nav";
import PostLoader from "@/components/postLoader";

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
