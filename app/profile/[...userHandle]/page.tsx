import Nav from "@/components/nav";
import ProfileLoader from "@/components/profileLoader";
import PostsLoader from "@/components/postsLoader";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userHandle: string[] }>;
}) {
  const userHandle = decodeURIComponent((await params).userHandle.join("/"));

  // Parse different handle formats
  let handle = userHandle;
  if (!userHandle.startsWith("@")) {
    handle = `@${userHandle}`;
  }

  // Ensure handle has proper format @username@server.com
  const parts = handle.split("@");
  if (parts.length !== 3 || !parts[1] || !parts[2]) {
    // Invalid format - should be @username@server.com which splits into ["", "username", "server.com"]
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-fg-muted">
            Invalid profile handle format. Expected: @username@server.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <ProfileLoader handle={handle} />
        <PostsLoader handle={handle} />
      </div>
    </div>
  );
}
