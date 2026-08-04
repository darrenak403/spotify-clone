import {ScrollArea} from "@/components/ui/scroll-area";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {axiosInstance} from "@/lib/axios";
import {Music} from "lucide-react";
import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import Seo from "@/components/Seo";
import {buildArtistJsonLd, serializeJsonLd} from "@/lib/jsonLd";

interface ArtistAlbumSummary {
  _id: string;
  title: string;
  slug: string;
  imageUrl: string;
  releaseYear: number;
  songCount: number;
}

interface ArtistStandaloneSong {
  _id: string;
  title: string;
  imageUrl: string;
  duration: number;
}

interface ArtistPageData {
  slug: string;
  name: string;
  albums: ArtistAlbumSummary[];
  standaloneSongs: ArtistStandaloneSong[];
  updatedAt: string;
}

const ArtistPage = () => {
  const {slug} = useParams();
  const [artist, setArtist] = useState<ArtistPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setIsLoading(true);
    setNotFound(false);

    axiosInstance
      .get(`/artists/${slug}`)
      .then((res) => setArtist(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) return null;

  if (notFound || !artist) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400">
        Artist not found
      </div>
    );
  }

  const totalSongs =
    artist.albums.reduce((sum, album) => sum + album.songCount, 0) +
    artist.standaloneSongs.length;

  const artistDescription = `${artist.name} on Evon — ${artist.albums.length} album${
    artist.albums.length === 1 ? "" : "s"
  }, ${totalSongs} song${totalSongs === 1 ? "" : "s"}.`;

  return (
    <div className="h-full">
      <Seo
        title={artist.name}
        description={artistDescription}
        canonicalPath={`/artists/${artist.slug}`}
        image={artist.albums[0]?.imageUrl}
        type="profile"
      />
      <script type="application/ld+json">
        {serializeJsonLd(buildArtistJsonLd(artist))}
      </script>
      <ScrollArea className="h-full rounded-md">
        <div className="relative min-h-full">
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80
					 to-zinc-900 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 p-4 sm:p-6">
            <p className="text-sm font-medium">Artist</p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold my-4 break-words">
              {artist.name}
            </h1>
            <div className="text-sm text-zinc-100 mb-8">
              {artist.albums.length} album
              {artist.albums.length === 1 ? "" : "s"} • {totalSongs} song
              {totalSongs === 1 ? "" : "s"}
            </div>

            {artist.albums.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {artist.albums.map((album) => (
                    <Link
                      key={album._id}
                      to={`/albums/${album.slug}`}
                      className="bg-zinc-800/50 hover:bg-zinc-800 p-3 rounded-md transition-colors"
                    >
                      <img
                        src={getOptimizedImageUrl(album.imageUrl)}
                        alt={album.title}
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-md mb-2"
                      />
                      <div className="text-sm font-medium truncate">
                        {album.title}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {album.releaseYear} • {album.songCount} song
                        {album.songCount === 1 ? "" : "s"}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {artist.standaloneSongs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Singles</h2>
                <div className="space-y-1">
                  {artist.standaloneSongs.map((song) => (
                    <div
                      key={song._id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800/50"
                    >
                      <Music className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span className="text-sm truncate">{song.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ArtistPage;
