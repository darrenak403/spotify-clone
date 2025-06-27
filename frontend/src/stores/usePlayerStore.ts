import { create } from "zustand";
import type { Song } from "@/types";

interface PlayerStore { 
    currentSong: Song | null;
    isPlaying: boolean;
    queue: Song[];
    currentIndex: number;

    initializeQueue: (songs: Song[]) => void;
    playAlbum: (songs: Song[], startIndex?: number) => void;
    setCurrentSong: (song: Song | null) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,

    initializeQueue: (songs: Song[]) => {
        set({
            queue: songs,
            currentSong: get().currentSong || songs[0],
            currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
            // isPlaying: false
        });
     },
    playAlbum: (songs: Song[], startIndex = 0) => {
        if (songs.length === 0) return;
        
        const song = songs[startIndex];

        set({
            queue: songs,
            currentSong: song,
            currentIndex: startIndex,
            isPlaying: true
        });
    },
    setCurrentSong: (song: Song | null) => {
        if (!song) return;

        const songIndex = get().queue.findIndex(s => s._id === song._id);
        set({
            currentSong: song,
            currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
            isPlaying: true
        });
    },
    togglePlay: () => {
        const willStartPlaying = !get().isPlaying;
        //navigate to the current song if it exists
        set({
            isPlaying: willStartPlaying
        });
    },
    playNext: () => {
        const { currentIndex, queue } = get();
        const nextIndex = (currentIndex + 1);
        
        //If there iu a next song to play, let's play it
        if (nextIndex < queue.length) {
            const nextSong = queue[nextIndex];
            set({
                currentSong: nextSong,
                currentIndex: nextIndex,
                isPlaying: true
            });
        } else {
            // If no next song, stop playing
            set({ isPlaying: false });
        }

    },
    playPrevious: () => {
        const { currentIndex, queue } = get();
        const previousIndex = (currentIndex - 1);
        //If there is a previous song to play, let's play it
        if (previousIndex >= 0) {
            const previousSong = queue[previousIndex];
            set({
                currentSong: previousSong,
                currentIndex: previousIndex,
                isPlaying: true
            });
        } else {
            // If no previous song, stop playing
            set({ isPlaying: false });
        }
    }
}));
