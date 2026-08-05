import {Sparkles} from "lucide-react";
import SignInOAuthButton from "@/components/SignInOAuthButton";

const GuestRecommendationCard = () => {
  return (
    <div
      className="relative mb-8 overflow-hidden rounded-[20px] border border-white/[0.07]
      bg-gradient-to-br from-zinc-800/90 to-zinc-950/90 p-5"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
          <Sparkles className="h-5 w-5" />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
          Made for you
        </p>

        <h3 className="mt-2 max-w-[280px] text-xl font-bold leading-tight text-white">
          Music picked for your taste
        </h3>

        <p className="mt-2 max-w-[320px] text-sm leading-6 text-zinc-400">
          Sign in to get personalized songs, playlists, and albums based on what you love.
        </p>

        <SignInOAuthButton className="mt-5" />

        <p className="mt-3 text-center text-xs text-zinc-500">It only takes a moment.</p>
      </div>
    </div>
  );
};

export default GuestRecommendationCard;
