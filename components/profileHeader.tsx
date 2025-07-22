import Image from "next/image";
import Swirl1 from "@/public/swirl-1.svg";
import Swirl2 from "@/public/swirl-2.svg";
import AuthorIconMobileBg from "@/public/author-icon-mobile-bg.svg";
import type { CustomEmoji } from "@/util/emoji";
import EmojiText from "@/components/emojiText";
import EmojiHtml from "@/components/emojiHtml";

export type SimpleActorProfile = {
  id?: string;
  name?: unknown;
  preferredUsername?: unknown;
  url?: string;
  avatarUrl?: string;
  summary?: string;
  emojis?: CustomEmoji[];
  followersCount?: number;
  followingCount?: number;
  outboxCount?: number;
  published?: string;
};

export default function ProfileHeader({
  actor,
}: {
  actor: SimpleActorProfile;
}) {
  const username = `@${actor.preferredUsername?.toString()}`;
  const server = actor.url ? `@${new URL(actor.url).host}` : "";
  const fullIdentifier = `${username}${server}`;

  const displayNameText =
    actor.name?.toString() ||
    actor.preferredUsername?.toString() ||
    "Unknown User";

  // Get the bio text for emoji processing
  const bioText = actor.summary || "";

  return (
    <div className="relative w-full">
      {/* Background decorations */}
      <Swirl1 className="absolute z-0 -left-8 -top-8 hidden sm:block text-bg-darker" />
      <Swirl2 className="absolute z-0 -right-6 -bottom-4 transform scale-125 hidden sm:block text-bg-darker" />

      <div className="relative z-10 bg-bg-lighter rounded-2xl p-8 border-4 border-bg-darker shadow-lg">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar section */}
          <div className="relative flex-shrink-0">
            <AuthorIconMobileBg className="absolute z-0 -left-5 -top-3 sm:hidden transform scale-150" />
            {actor.avatarUrl ? (
              <div className="relative z-10 w-[120px] h-[120px]">
                <Image
                  src={actor.avatarUrl}
                  alt={displayNameText}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover filter sepia profile-avatar-clip"
                />
              </div>
            ) : (
              <div className="relative z-10 w-[120px] h-[120px] bg-bg-darker flex items-center justify-center profile-avatar-clip">
                <span className="text-2xl text-fg-muted">?</span>
              </div>
            )}
          </div>

          {/* Profile info section */}
          <div className="flex-1 min-w-0">
            {/* Name and handle */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-fg mb-2">
                <EmojiText text={displayNameText} emojis={actor.emojis} />
              </h1>
              <p className="text-lg text-fg-muted font-mono">
                {fullIdentifier}
              </p>
            </div>

            {/* Bio/Description */}
            {bioText && (
              <div className="mb-6">
                <EmojiHtml
                  html={bioText}
                  emojis={actor.emojis}
                  className="text-fg prose prose-sm max-w-none"
                />
              </div>
            )}

            {/* Profile link */}
            {actor.url && (
              <div className="mb-4">
                <a
                  href={actor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-fg hover:text-amber-700 focus:text-amber-700 hover:underline focus:underline decoration-2 underline-offset-4 outline-none transition-colors"
                >
                  <span className="mr-2">🔗</span>
                  View on{" "}
                  {actor.url ? new URL(actor.url).host : "original server"}
                </a>
              </div>
            )}

            {/* Profile metadata */}
            {(actor.followersCount !== undefined ||
              actor.followingCount !== undefined ||
              actor.outboxCount !== undefined ||
              actor.published) && (
              <div className="mt-6 pt-4 border-t border-bg-darker">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
                  {actor.followersCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className="text-fg font-medium">
                        {actor.followersCount.toLocaleString()}
                      </span>
                      <span>Followers</span>
                    </span>
                  )}
                  {actor.followingCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className="text-fg font-medium">
                        {actor.followingCount.toLocaleString()}
                      </span>
                      <span>Following</span>
                    </span>
                  )}
                  {actor.outboxCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className="text-fg font-medium">
                        {actor.outboxCount.toLocaleString()}
                      </span>
                      <span>Posts</span>
                    </span>
                  )}
                  {actor.published && (
                    <span className="flex items-center gap-1">
                      <span>Joined</span>
                      <span className="text-fg font-medium">
                        {new Date(actor.published).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
