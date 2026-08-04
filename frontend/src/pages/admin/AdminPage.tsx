import {Navigate} from "react-router-dom";
import {useAuthStore} from "@/stores/useAuthStore";
import {useAuth} from "@/providers/AuthProvider";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import {Album, Music} from "lucide-react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {TabsContent} from "@radix-ui/react-tabs";
import SongTabContent from "./components/SongTabContent";
import AlbumTabContent from "./components/AlbumTabContent";
import {useEffect} from "react";
import {useMusicStore} from "@/stores/useMusicStore";

const AdminPage = () => {
  const {isAdmin, isLoading} = useAuthStore();
  const {authReady} = useAuth();

  // fetchAlbums (full list) is kept here for AddSongDialog's album picker —
  // SongTable/AlbumsTable use their own separate paginated fetch instead.
  const {albums, statsLoaded, fetchAlbums, fetchStats} = useMusicStore();

  useEffect(() => {
    // Wait for AuthProvider to finish restoring the Firebase session and
    // attaching the Authorization header before firing admin-only requests
    // (fetchStats requires auth; firing early causes a spurious 401).
    if (!authReady) return;
    if (albums.length === 0) fetchAlbums();
    if (!statsLoaded) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);
  if (!isAdmin && !isLoading) {
    return <Navigate to="/" replace />;
  }
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8"
    >
      <Header />

      <DashboardStats />

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="p-1 bg-zinc-800/50">
          <TabsTrigger
            value="songs"
            className="data-[state=active]:bg-zinc-700"
          >
            <Music className="mr-2 size 4" />
            Songs
          </TabsTrigger>
          <TabsTrigger
            value="albums"
            className="data-[state=active]:bg-zinc-700"
          >
            <Album className="mr-2 size 4" />
            Albums
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          <SongTabContent />
        </TabsContent>
        <TabsContent value="albums">
          <AlbumTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
