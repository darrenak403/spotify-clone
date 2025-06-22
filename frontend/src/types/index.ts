export interface Song {
    _id: string;
    title: string;
    artist: string;
    albumId: string | null;
    imageUrl: string;
    audioUrl: string;
    duration: number; // in seconds
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface Album {
    _id: string;
    title: string;
    artist: string;
    imageUrl: string;
    releaseYear: number;
    songs: Song[];
}