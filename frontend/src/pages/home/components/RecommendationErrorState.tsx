import type {RecommendationErrorTag} from "@/lib/getRecommendationState";

type RecommendationErrorStateProps = {
  tag: Exclude<RecommendationErrorTag, "guest">;
  onRetry: () => void;
};

const RecommendationErrorState = ({tag, onRetry}: RecommendationErrorStateProps) => {
  const description =
    tag === "network-error"
      ? "Check your connection and try again."
      : "We couldn't load your recommendations. Please try again.";

  return (
    <div className="mb-8 rounded-2xl border border-white/[0.07] bg-zinc-900 p-5">
      <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 h-11 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
};

export default RecommendationErrorState;
