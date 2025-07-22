"use client";

import { Suspense, useState, useEffect } from "react";
import ProfileHeader from "@/components/profileHeader";
import type { SimpleActorProfile } from "@/components/profileHeader";

// Client-side profile data fetcher
async function fetchProfileData(
  handle: string,
): Promise<SimpleActorProfile | null> {
  try {
    const response = await fetch(`/api/profile/${encodeURIComponent(handle)}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}

function ProfileContent({ handle }: { handle: string }) {
  const [profile, setProfile] = useState<SimpleActorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileData(handle)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [handle]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="relative w-full">
        <div className="relative z-10 bg-bg-lighter rounded-2xl p-8 border-4 border-bg-darker shadow-lg">
          <p className="text-fg-muted text-center">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return <ProfileHeader actor={profile} />;
}

function ProfileSkeleton() {
  return (
    <div className="relative w-full">
      <div className="relative z-10 bg-bg-lighter rounded-2xl p-8 border-4 border-bg-darker shadow-lg">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar skeleton */}
          <div className="relative flex-shrink-0">
            <div className="relative z-10 w-[120px] h-[120px] bg-bg-darker animate-pulse profile-avatar-clip"></div>
          </div>

          {/* Profile info skeleton */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <div className="h-8 bg-bg-darker animate-pulse rounded mb-2 w-48"></div>
              <div className="h-6 bg-bg-darker animate-pulse rounded w-64"></div>
            </div>
            <div className="mb-6">
              <div className="h-4 bg-bg-darker animate-pulse rounded mb-2 w-full"></div>
              <div className="h-4 bg-bg-darker animate-pulse rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-bg-darker animate-pulse rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileLoader({ handle }: { handle: string }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent handle={handle} />
    </Suspense>
  );
}
