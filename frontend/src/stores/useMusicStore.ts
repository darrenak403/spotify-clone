import { axiosInstance } from '@/lib/axios';
import type { Album, Song, Stats } from '@/types';
import toast from 'react-hot-toast';
import { create } from 'zustand';

const ADMIN_PAGE_SIZE = 20;

interface MusicStore {
    songs: Song[];
    albums: Album[];
    isLoading: boolean;
    error: string | null;
    currentAlbum: Album | null;
    featuredSongs: Song[]; // Assuming you have a featuredSongs array
    madeForYouSongs: Song[]; // Assuming you have a madeForYouSongs array
    trendingSongs: Song[]; // Assuming you have a trendingSongs array
    stats: Stats;
    statsLoaded: boolean;

    // Paginated state for admin tables only — separate from `songs`/`albums`,
    // which stay full-list for LeftSidebar and other existing consumers.
    paginatedSongs: Song[];
    paginatedAlbums: Album[];
    hasMoreSongs: boolean;
    hasMoreAlbums: boolean;
    isLoadingMoreSongs: boolean;
    isLoadingMoreAlbums: boolean;

    fetchAlbums: () => Promise<void>;
    fetchAlbumById: (id: string) => Promise<void>;
    fetchFeaturedSongs: () => Promise<void>;
    fetchMadeForYouSongs: () => Promise<void>;
    fetchTrendingSongs: () => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchSongs: () => Promise<void>;
    fetchSongsPage: (reset?: boolean) => Promise<void>;
    fetchAlbumsPage: (reset?: boolean) => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
    deleteAlbum: (id: string) => Promise<void>; // Optional if you want to implement album deletion
}

export const useMusicStore = create<MusicStore>((set, get) => ({
    albums: [],
    songs: [],
    isLoading: false,
    error: null,
    currentAlbum: null,
    featuredSongs: [],
    madeForYouSongs: [],
    trendingSongs: [],
    stats: {
        totalSongs: 0,
        totalAlbums: 0,
        totalArtists: 0,
        totalUsers: 0,
    },
    statsLoaded: false,
    paginatedSongs: [],
    paginatedAlbums: [],
    hasMoreSongs: true,
    hasMoreAlbums: true,
    isLoadingMoreSongs: false,
    isLoadingMoreAlbums: false,

   deleteSong: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/songs/${id}`);

			set((state) => ({
				songs: state.songs.filter((song) => song._id !== id),
				paginatedSongs: state.paginatedSongs.filter((song) => song._id !== id),
			}));
			toast.success("Song deleted successfully");
		} catch (error: any) {
			console.log("Error in deleteSong", error);
			toast.error("Error deleting song");
		} finally {
			set({ isLoading: false });
		}
	},

    deleteAlbum: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/albums/${id}`);
			set((state) => ({
				albums: state.albums.filter((album) => album._id !== id),
				paginatedAlbums: state.paginatedAlbums.filter((album) => album._id !== id),
				songs: state.songs.map((song) =>
					song.albumId === state.albums.find((a) => a._id === id)?.title ? { ...song, album: null } : song
				),
			}));
			toast.success("Album deleted successfully");
		} catch (error: any) {
			toast.error("Failed to delete album: " + error.message);
		} finally {
			set({ isLoading: false });
		}
	},

    fetchSongsPage: async (reset = false) => {
        const { paginatedSongs } = get();
        const skip = reset ? 0 : paginatedSongs.length;
        set({ isLoadingMoreSongs: true, error: null });
        try {
            const response = await axiosInstance.get(
                `/songs?limit=${ADMIN_PAGE_SIZE}&skip=${skip}`
            );
            const nextSongs: Song[] = response.data;
            set((state) => ({
                paginatedSongs: reset ? nextSongs : [...state.paginatedSongs, ...nextSongs],
                hasMoreSongs: nextSongs.length === ADMIN_PAGE_SIZE,
            }));
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoadingMoreSongs: false });
        }
    },

    fetchAlbumsPage: async (reset = false) => {
        const { paginatedAlbums } = get();
        const skip = reset ? 0 : paginatedAlbums.length;
        set({ isLoadingMoreAlbums: true, error: null });
        try {
            const response = await axiosInstance.get(
                `/albums?limit=${ADMIN_PAGE_SIZE}&skip=${skip}`
            );
            const nextAlbums: Album[] = response.data;
            set((state) => ({
                paginatedAlbums: reset ? nextAlbums : [...state.paginatedAlbums, ...nextAlbums],
                hasMoreAlbums: nextAlbums.length === ADMIN_PAGE_SIZE,
            }));
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoadingMoreAlbums: false });
        }
    },

    fetchSongs: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/songs");
            set({ songs: response.data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/stats");
            set({ stats: response.data, statsLoaded: true });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },


    fetchAlbums: async () => { 
        //data fetching logic
        try {
            const response = await axiosInstance.get("/albums")
            set({ albums: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAlbumById: async (id) => { 
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get(`/albums/${id}`);
            set({ currentAlbum: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchFeaturedSongs: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/songs/featured");
            set({ featuredSongs: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchMadeForYouSongs: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/songs/made-for-you");
            set({ madeForYouSongs: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchTrendingSongs: async () => { 
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/songs/trending");
            set({ trendingSongs: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },
}));