import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {cn} from "@/lib/utils";
import {useMusicStore} from "@/stores/useMusicStore";
import {useEffect} from "react";
import {Link} from "react-router-dom";

interface AlbumListProps {
  // Sidebar usage hides title/artist below the `md` breakpoint (narrow panel);
  // the standalone Library page has full width so it always shows them.
  compact?: boolean;
}

const AlbumList = ({compact = false}: AlbumListProps) => {
  const {albums, fetchAlbums, isLoading} = useMusicStore();

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  if (isLoading) return <PlaylistSkeleton />;

  return (
    <div className="space-y-2">
      {albums.map((album) => (
        <Link
          to={`/albums/${album.slug}`}
          key={album._id}
          className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer"
        >
          <img
            src={getOptimizedImageUrl(album.imageUrl)}
            alt="Playlist img"
            loading="lazy"
            className="size-12 rounded-md flex-shrink-0 object-cover"
          />

          <div className={cn("flex-1 min-w-0", compact && "hidden md:block")}>
            <p className="font-medium truncate">{album.title}</p>
            <p className="text-sm text-zinc-400 truncate">
              Album • {album.artist}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default AlbumList;
