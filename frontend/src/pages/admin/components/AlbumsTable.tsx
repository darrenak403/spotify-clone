import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {useDebounce} from "@/hooks/useDebounce";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {useMusicStore} from "@/stores/useMusicStore";
import {Calendar, Music, Trash2} from "lucide-react";
import {memo, useEffect, useMemo, useState} from "react";

const AlbumsTable = () => {
  const {
    paginatedAlbums,
    hasMoreAlbums,
    isLoadingMoreAlbums,
    fetchAlbumsPage,
    deleteAlbum,
  } = useMusicStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchAlbumsPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAlbums = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return paginatedAlbums;
    return paginatedAlbums.filter(
      (album) =>
        album.title.toLowerCase().includes(term) ||
        album.artist.toLowerCase().includes(term)
    );
  }, [paginatedAlbums, debouncedSearch]);

  return (
    <div>
      <Input
        placeholder="Search albums by title or artist..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Release Year</TableHead>
            <TableHead>Songs</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlbums.map((album) => (
            <TableRow key={album._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={getOptimizedImageUrl(album.imageUrl)}
                  alt={album.title}
                  loading="lazy"
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{album.title}</TableCell>
              <TableCell>{album.artist}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {album.releaseYear}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Music className="h-4 w-4" />
                  {album.songs.length} songs
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlbum(album._id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!debouncedSearch && hasMoreAlbums && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchAlbumsPage(false)}
            disabled={isLoadingMoreAlbums}
          >
            {isLoadingMoreAlbums ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};
export default memo(AlbumsTable);
