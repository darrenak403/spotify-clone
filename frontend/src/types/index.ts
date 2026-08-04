export interface Song {
	_id: string;
	title: string;
	artist: string;
	genre: string | null;
	description: string | null;
	albumId: string | null;
	imageUrl: string;
	audioUrl: string;
	duration: number;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	slug: string;
	genre: string | null;
	description: string | null;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
	// Only set by the paginated list endpoint (getAllAlbums), which doesn't
	// load full song rows — getAlbumById sets `songs` instead.
	songCount?: number;
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	fullName: string;
	imageUrl: string;
}