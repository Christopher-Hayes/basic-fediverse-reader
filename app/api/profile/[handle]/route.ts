import { lookupObject } from "@fedify/fedify";
import { context, INSTANCE_ACTOR } from "@/util/federation";
import { Actor } from "@fedify/fedify/vocab";
import { NextRequest, NextResponse } from "next/server";
import type { SimpleActorProfile } from "@/components/profileHeader";

// Get document loader for ActivityPub operations
const getDocumentLoader = async () => {
  return await context.getDocumentLoader({
    identifier: INSTANCE_ACTOR,
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    const handle = decodeURIComponent((await params).handle);

    // Parse different handle formats
    let processedHandle = handle;
    if (!handle.startsWith("@")) {
      processedHandle = `@${handle}`;
    }

    // Ensure handle has proper format @username@server.com
    const parts = processedHandle.split("@");
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      return NextResponse.json(
        { error: "Invalid handle format. Expected: @username@server.com" },
        { status: 400 },
      );
    }

    const documentLoader = await getDocumentLoader();

    // Fetch the user/actor
    const actor = (await lookupObject(processedHandle, {
      documentLoader,
    })) as Actor | null;

    if (!actor) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get actor properties
    const icon = await actor.getIcon({ documentLoader });
    const summary = actor.summary;

    // Convert actor to simple type
    const simpleActor: SimpleActorProfile = {
      id: actor.id?.toString(),
      name: actor.name,
      preferredUsername: actor.preferredUsername,
      url: actor.url?.toString(),
      avatarUrl: icon?.url?.toString(),
      summary: summary?.toString(),
    };

    return NextResponse.json(simpleActor);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
