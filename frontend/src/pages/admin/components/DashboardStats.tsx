import {useMusicStore} from "@/stores/useMusicStore";
import {Library, ListMusic, PlayCircle, Users2} from "lucide-react";
import StatsCard from "./StatsCard";
import {Card, CardContent} from "@/components/ui/card";

const DashboardStats = () => {
  const {stats, statsLoaded} = useMusicStore();

  if (!statsLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({length: 4}).map((_, i) => (
          <Card key={i} className="bg-zinc-800/50 border-zinc-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-zinc-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      icon: ListMusic,
      label: "Total Songs",
      value: stats.totalSongs.toString(),
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      icon: Library,
      label: "Total Albums",
      value: stats.totalAlbums.toString(),
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-500",
    },
    {
      icon: Users2,
      label: "Total Artists",
      value: stats.totalArtists.toString(),
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      icon: PlayCircle,
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      bgColor: "bg-sky-500/10",
      iconColor: "text-sky-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          bgColor={stat.bgColor}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
};
export default DashboardStats;
