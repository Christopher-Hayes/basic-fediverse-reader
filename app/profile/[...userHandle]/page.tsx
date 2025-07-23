import Nav from "@/components/nav";
import ProfileHeader from "@/components/profileHeader";
import PostsLoader from "@/components/postsLoader";
import { fetchProfileData } from "@/lib/server-actions";

// Revalidate the page once per day (86400 seconds = 24 hours)
export const revalidate = 86400;

// Pre-generate the commonly visited profile page
export async function generateStaticParams() {
  return [
    {
      userHandle: ["@chris@floss.social"],
    },
    {
      userHandle: ["chris@floss.social"],
    },
  ];
}

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

  // Server-side render the profile header for better caching
  const profileData = await fetchProfileData(handle);

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-fg-muted">
            Profile not found or failed to load
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Server-rendered profile header - loads instantly */}
        <ProfileHeader actor={profileData} />

        {/* Client-rendered posts - loads progressively without blocking */}
        <PostsLoader handle={handle} />
      </div>
    </div>
  );
}
