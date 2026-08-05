import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import type {ReactNode} from "react";

type HorizontalMusicSectionProps = {
  title: string;
  ariaLabel?: string;
  onSeeAll?: () => void;
  /** Extra classes for the scroll track — mainly the desktop `sm:grid-cols-*` variant. */
  className?: string;
  children: ReactNode;
};

// Single scroll container: the row itself carries the negative-margin bleed
// AND overflow-x-auto, so there is no separate overflow-hidden wrapper that
// could block native touch-swipe gestures on the carousel.
const HorizontalMusicSection = ({
  title,
  ariaLabel,
  onSeeAll,
  className,
  children,
}: HorizontalMusicSectionProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <Button
          variant="link"
          onClick={onSeeAll}
          className="text-sm text-zinc-400 hover:text-white"
        >
          See all
        </Button>
      </div>

      <div
        aria-label={ariaLabel ?? title}
        className={cn(
          "-mx-4 flex flex-nowrap gap-3 overflow-x-auto overflow-y-visible px-4 pb-2",
          "snap-x snap-mandatory touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default HorizontalMusicSection;
