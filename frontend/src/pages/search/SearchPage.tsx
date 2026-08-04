import SongRow from "@/components/SongRow";
import {Input} from "@/components/ui/input";
import {useMusicStore} from "@/stores/useMusicStore";
import {Search as SearchIcon} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

const SearchPage = () => {
  const {songs, fetchSongs, isLoading} = useMusicStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (songs.length === 0) fetchSongs();
  }, [fetchSongs, songs.length]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term)
    );
  }, [songs, query]);

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="pl-9 bg-zinc-800 border-zinc-700"
        />
      </div>

      {!query.trim() && (
        <p className="text-sm text-zinc-400">Search by song title or artist.</p>
      )}

      {query.trim() && !isLoading && results.length === 0 && (
        <p className="text-sm text-zinc-400">No results for "{query}".</p>
      )}

      <div className="space-y-1">
        {results.map((song, index) => (
          <SongRow key={song._id} song={song} songs={results} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
