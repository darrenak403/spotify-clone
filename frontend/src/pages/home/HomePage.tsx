import {useMusicStore} from "@/stores/useMusicStore";
import {useEffect} from "react";
import FeaturedSection from "./components/FeaturedSection";
import {ScrollArea} from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import TrendingSection from "./components/TrendingSection";
import {usePlayerStore} from "@/stores/usePlayerStore";
import TopBar from "@/components/TopBar";
import Seo from "@/components/Seo";
import {buildSiteJsonLd, serializeJsonLd} from "@/lib/jsonLd";

const siteJsonLd = buildSiteJsonLd();

const HomePage = () => {
  const {
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    isLoading,
    madeForYouSongs,
    featuredSongs,
    trendingSongs,
  } = useMusicStore();

  const {initializeQueue} = usePlayerStore();

  useEffect(() => {
    if (featuredSongs.length === 0) fetchFeaturedSongs();
    if (madeForYouSongs.length === 0) fetchMadeForYouSongs();
    if (trendingSongs.length === 0) fetchTrendingSongs();
    // Only re-fetch if this list is still empty — avoids re-triggering the
    // loading skeleton every time the user navigates back to this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      madeForYouSongs.length > 0 &&
      featuredSongs.length > 0 &&
      trendingSongs.length > 0
    ) {
      const allSongs = [...madeForYouSongs, ...featuredSongs, ...trendingSongs];
      initializeQueue(allSongs);
    }
  }, [initializeQueue, madeForYouSongs, featuredSongs, trendingSongs]);
  // console.log({isLoading, madeForYouSongs, featuredSongs, trendingSongs});

  return (
    <main className="rounded-md overflow-hidden h-full flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 ">
      <Seo
        title="Evon — Stream Music Online"
        description={siteJsonLd.description}
        canonicalPath="/"
      />
      <script type="application/ld+json">{serializeJsonLd(siteJsonLd)}</script>
      <TopBar />
      <ScrollArea className="flex-1 min-h-0">
        <div className="min-w-0 px-4 pt-5 sm:px-6 sm:pt-6 pb-[calc(176px+env(safe-area-inset-bottom))] md:pb-6">
          <h1 className="text-[28px] sm:text-3xl font-bold leading-tight truncate">
            Good Afternoon
          </h1>
          <p className="mt-3 mb-8 line-clamp-2 text-[15px] leading-6 text-zinc-400 sm:line-clamp-none">
            {siteJsonLd.description}
          </p>
          <FeaturedSection />

          <div className="space-y-8">
            <SectionGrid
              title="Made For You"
              songs={madeForYouSongs}
              isLoading={isLoading}
            />
            <TrendingSection
              songs={trendingSongs}
              isLoading={isLoading}
            />
          </div>
        </div>
      </ScrollArea>
    </main>
  );
};

export default HomePage;
