"use client";
import NavBg from "@/public/nav-bg.svg";
import InputBg from "@/public/nav-input-bg.svg";
import InputBorder from "@/public/nav-input-border.svg";
import SubmitBg from "@/public/nav-submit-bg.svg";
import SubmitBorder from "@/public/nav-submit-border.svg";
import { parseFediverseUrl } from "@/util/helpers";

// Nav react component
export default function Nav() {
  const handleSubmit = () => {
    const input = document.getElementById(
      "fediverse-url-input",
    ) as HTMLInputElement;
    let url = input.value;

    // Input field placeholder - use if user hits "GO" without entering a URL
    if (!url) {
      url = "fosstodon.org/@chris_hayes/113585246591456543";
    }

    if (url) {
      const parsed = parseFediverseUrl(url);

      if (parsed) {
        if (parsed.type === "profile") {
          // Navigate to profile page using the parsed handle path
          window.location.href = `/profile/${parsed.path}`;
        } else {
          // Navigate to post page (existing behavior)
          window.location.href = `/post/${parsed.path}`;
        }
      } else {
        // Fallback to existing behavior
        url = url.replace("https://", "").replace("http://", "");
        window.location.href = `/post/${url}`;
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <nav className="relative w-full flex justify-center py-4 sm:py-8 px-4">
      <NavBg className="hidden sm:block absolute -mt-4 z-0 h-full transform scale-[200%] -translate-x-4" />
      <div className="relative z-10 flex justify-center items-center gap-12">
        <div className="group/input relative px-8 w-full max-w-80">
          <InputBg className="absolute text-bg-darker group-hover/input:text-highlight group-focus-within/input:text-highlight mt-1 -ml-5 z-10 w-full" />
          <InputBorder className="absolute -mt-2 -ml-10 z-10 w-full" />
          <input
            id="fediverse-url-input"
            type="url"
            placeholder="https://floss.social/@chris or post URL"
            className="p-4 relative z-20 w-full bg-transparent outline-none text-fg placeholder-fg-muted text-ellipsis"
            onKeyUp={handleKeyUp}
          />
        </div>
        <div className="pr-8">
          <div className="group/submit relative">
            <SubmitBg className="absolute text-bg-darker group-hover/submit:text-highlight group-focus-within/submit:text-highlight ml-1 mt-2 z-10 w-full transform scale-[170%]" />
            <SubmitBorder className="absolute z-10 w-full transform scale-125" />
            <button
              className="relative z-20 py-4 px-6 outline-none"
              onClick={handleSubmit}
            >
              GO
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
