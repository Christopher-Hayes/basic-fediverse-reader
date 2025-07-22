import { fetchUserPosts } from "@/util/fetchPost";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    const handle = decodeURIComponent((await params).handle);
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 6;

    // Parse different handle formats
    let processedHandle = handle;
    if (!handle.startsWith("@")) {
      processedHandle = `@${handle}`;
    }

    // Fetch recent posts
    const recentPosts = await fetchUserPosts(processedHandle, limit);

    return NextResponse.json(recentPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
