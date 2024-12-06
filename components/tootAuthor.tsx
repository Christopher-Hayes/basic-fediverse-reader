import { Temporal } from "@js-temporal/polyfill";
import Image from "next/image";
import Swirl1 from "@/public/swirl-1.svg";
import Swirl2 from "@/public/swirl-2.svg";
import { timeSince } from "@/util/helpers";
import { Actor, Note } from "@fedify/fedify/vocab";
import AuthorHoverCloudBg from "@/public/author-hover-cloud-bg.svg";
import AuthorIconMobileBg from "@/public/author-icon-mobile-bg.svg";
import AuthorNameMobileBg from "@/public/author-name-mobile-bg.svg";

export default async function TootAuthor({
  post,
  person,
}: {
  post: Note;
  person: Actor;
}) {
  const icon = await person.getIcon();
  const now = Temporal.Now.instant();
  // Show time since in human readable format
  const timeSinceString = post.published
    ? timeSince(Temporal.Duration.from(now.since(post?.published)))
    : "Some time, I forget";
  /*
  // YYYY
  const publishedYear = post?.published?.toLocaleString("en-US", {
    year: "numeric",
  });
  const currentYear = now.toLocaleString("en-US", { year: "numeric" });
  // MM DD
  const publishedMonthDay = post?.published?.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
  // DOW
  const publishedDayOfWeek = post?.published?.toLocaleString("en-US", {
    weekday: "long",
  });
  */

  const username = `@${person.preferredUsername?.toString()}`;
  const server = `@${
    typeof person.url === "string"
      ? new URL(person.url).host
      : (person.url as URL)?.host ?? ""
  }`;
  const fullIdentifier = `${username}${server}`;
  const HIGHLIGHT_PATH_LENGTH = 708;

  return (
    <div className="w-full px-4 py-12 flex gap-x-4 gap-y-24 sm:gap-y-12  flex-col sm:flex-row items-center justify-between">
      <div className="flex-grow relative flex gap-4 items-center flex-col sm:flex-row">
        <Swirl1 className="absolute z-0 -left-8 -top-8 hidden sm:block" />
        <AuthorIconMobileBg className="absolute z-0 -left-5 -top-3 sm:hidden" />
        <Image
          src={icon?.url?.toString() ?? ""}
          alt={person.name?.toString() ?? ""}
          width={64}
          height={64}
          className="relative z-10 pfp filter grayscale sm:grayscale-0 sm:sepia"
        />
        <div className="hidden sm:flex flex-col gap-1">
          <div className="relative text-xl text-fg-muted text-center sm:text-left">
            <span className="relative z-30 mr-2">BY</span>
            <a
              className="relative z-30 peer text-fg text-xl hover:underline focus:underline decoration-2 underline-offset-4 outline-none"
              href={person.url?.toString()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {person.name?.toString()}
            </a>
            <div className="p-4 absolute z-20 left-[calc(50%-2.5em)] -top-8 *:hidden sm:*:peer-hover:flex sm:*:peer-focus:flex *:hover:flex *:focus:flex">
              <AuthorHoverCloudBg className="cloud-svg overflow-visible transform scale-125" />
              <div className="mt-4 w-full">
                <div className="relative">
                  <p className="relative z-20 flex justify-center sm:justify-normal text-sm text-fg before:absolute before:z-0 before:transform before:scale-x-150 before:w-full before:h-8">
                    <span className="relative z-10">
                      {username}
                      {server}
                    </span>
                  </p>
                  <svg
                    className="absolute z-10 -top-2 -left-2.5 pointer-events-none text-bg-darker group-hover/link:text-highlight group-focus-within/link:text-highlight group-hover/link:z-20 group-focus-within/link:z-10"
                    xmlns="http://www.w3.org/2000/svg"
                    width={HIGHLIGHT_PATH_LENGTH}
                    height="34.619"
                    viewBox="0 0 187.198 9.16"
                  >
                    <path
                      d="M18.877-185.064c.754.49 1.4-.202 2.106-.214 3.555-.06 7.157-.206 10.712.007.77.046 1.503.223 2.27.287 1.38.115 2.784.2 4.169.274 1.677.09 3.286-.064 4.96-.08 3.756-.036 7.506.19 11.267.107 1.568-.035 3.133-.137 4.703-.154 2.839-.03 5.687.031 8.524-.06 4.144-.133 8.26-.734 12.407-.836 2.755-.067 5.518.093 8.267.214 2.783.124 5.604-.008 8.39.027 2.44.03 4.88.31 7.313.461 3.304.205 6.642.317 9.951.408 2.209.061 4.407 0 6.614.007 3.557.012 7.123.037 10.68-.046 1.713-.04 3.411-.184 5.126-.194 1.998-.013 3.963-.202 5.956-.295 2.764-.128 5.523-.176 8.288-.254 1.4-.039 2.8-.147 4.2-.147 2.166 0 4.329.209 6.491.261.456.011.985-.196 1.438-.24 1.4-.139 2.8-.29 4.2-.422 2.375-.223 4.797-.25 7.18-.394 1.56-.094 3.117-.241 4.683-.26 1.567-.02 3.135.06 4.703.046.773-.007 1.567-.057 2.342-.007.126.008.222.128.339.134.486.026.968.136 1.458.147 1.929.044 3.834.194 5.761.32 1.529.1 3.04.22 4.56.375.197.02.935-.023 1.037.107.043.054-.459.03-.914.026"
                      style={{
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: 7.14375,
                        strokeLinecap: "round",
                        strokeDasharray: `${HIGHLIGHT_PATH_LENGTH}px`,
                        strokeDashoffset: `${
                          HIGHLIGHT_PATH_LENGTH - fullIdentifier.length * 2.3
                        }px`,
                        strokeOpacity: 1,
                        paintOrder: "fill markers stroke",
                      }}
                      transform="translate(-15.306 190.183)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col gap-2 items-center">
        <Swirl2 className="absolute z-0 -right-6 -bottom-4 transform scale-125 hidden sm:block" />
        <AuthorNameMobileBg className="absolute z-0 -right-8 -top-0.5 transform scale-125 sm:hidden" />
        {/* On mobile, group author name and publish date together */}
        <div className="flex sm:hidden items-center gap-1 ">
          <span className="relative z-30 mr-2 text-fg-muted">BY</span>
          <a
            className="relative z-30 peer text-fg sm:text-xl hover:underline focus:underline decoration-2 underline-offset-4 outline-none"
            href={person.url?.toString()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {person.name?.toString()}
          </a>
        </div>
        <div className="relative z-10 flex flex-col gap-1 text-center sm:text-right text-fg-muted">
          <a
            href={post.url?.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base sm:text-xl hover:text-fg focus:text-fg hover:underline focus:underline decoration-2 underline-offset-4 outline-none"
          >
            {timeSinceString}
          </a>
          {/* <p className="whitespace-nowrap text-base">
            {publishedDayOfWeek}, {publishedMonthDay}{" "}
            {currentYear !== publishedYear && `, ${publishedYear}`}
          </p> */}
        </div>
      </div>
    </div>
  );
}
