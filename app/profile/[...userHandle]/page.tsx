import { lookupObject } from "@fedify/fedify";
import { context, INSTANCE_ACTOR } from "@/util/federation";
import { Actor } from "@fedify/fedify/vocab";
import { fetchUserPosts } from "@/util/fetchPost";
import Nav from "@/components/nav";
import ProfileHeader from "@/components/profileHeader";
import TootCardFull from "@/components/tootCardFull";

// Get document loader for ActivityPub operations
const getDocumentLoader = async () => {
  return await context.getDocumentLoader({
    identifier: INSTANCE_ACTOR,
  });
};

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
  if (handle.split("@").length === 2) {
    // If just @username, we need to extract from URL or handle differently
    // For now, return error state
    console.error("Invalid handle format, need @username@server.com");
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-fg-muted">Invalid profile handle format</p>
        </div>
      </div>
    );
  }

  try {
    const documentLoader = await getDocumentLoader();

    // Fetch the user/actor
    const actor = (await lookupObject(handle, {
      documentLoader,
    })) as Actor | null;

    if (!actor) {
      return (
        <div className="min-h-screen flex flex-col">
          <Nav />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-fg-muted">Profile not found</p>
          </div>
        </div>
      );
    }

    // Fetch recent posts
    const recentPosts = await fetchUserPosts(handle, 6);

    // Get actor properties
    const icon = await actor.getIcon({ documentLoader });
    const summary = actor.summary; // Use the summary property directly

    // Convert actor to simple type for ProfileHeader
    const simpleActor = {
      id: actor.id?.toString(),
      name: actor.name,
      preferredUsername: actor.preferredUsername,
      url: actor.url?.toString(),
      avatarUrl: icon?.url?.toString(),
      summary: summary?.toString(),
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <ProfileHeader actor={simpleActor} />

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-fg mb-6">Recent Posts</h2>
            {recentPosts.length > 0 ? (
              <div className="columns-1 md:columns-2 gap-6">
                {recentPosts.map((postData, index) => (
                  <TootCardFull
                    key={index}
                    post={postData.post}
                    author={postData.author}
                  />
                ))}
              </div>
            ) : (
              <p className="text-lg text-fg-muted">No recent posts found</p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading profile:", error);
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-fg-muted">Error loading profile</p>
        </div>
      </div>
    );
  }
}
