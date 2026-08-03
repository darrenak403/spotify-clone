import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import AdminTableSkeleton from "@/components/skeletons/AdminTableSkeleton";
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
import {Calendar, Trash2} from "lucide-react";
import {memo, useEffect, useMemo, useState} from "react";

const SongTable = () => {
  const {
    paginatedSongs,
    hasMoreSongs,
    isLoadingMoreSongs,
    error,
    fetchSongsPage,
    deleteSong,
  } = useMusicStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (paginatedSongs.length === 0) fetchSongsPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSongs = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return paginatedSongs;
    return paginatedSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term)
    );
  }, [paginatedSongs, debouncedSearch]);

  const isInitialLoading = isLoadingMoreSongs && paginatedSongs.length === 0;

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Input
        placeholder="Search songs by title or artist..."
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
            <TableHead>Release Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isInitialLoading && <AdminTableSkeleton columns={5} />}
          {!isInitialLoading &&
            filteredSongs.map((song) => (
            <TableRow key={song._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={getOptimizedImageUrl(song.imageUrl)}
                  alt={song.title}
                  loading="lazy"
                  className="size-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{song.title}</TableCell>
              <TableCell>{song.artist}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {song.createdAt.split("T")[0]}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => deleteSong(song._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!debouncedSearch && hasMoreSongs && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchSongsPage(false)}
            disabled={isLoadingMoreSongs}
          >
            {isLoadingMoreSongs ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(SongTable);
