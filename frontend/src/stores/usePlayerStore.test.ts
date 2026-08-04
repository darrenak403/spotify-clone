import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePlayerStore } from "./usePlayerStore";
import { useChatStore } from "./useChatStore";
import type { Song } from "@/types";

const song: Song = {
	_id: "song-1",
	title: "Test Track",
	artist: "Test Artist",
	genre: null,
	description: null,
	albumId: null,
	imageUrl: "https://example.com/art.png",
	audioUrl: "https://example.com/track.mp3",
	duration: 180,
	createdAt: "2024-01-01T00:00:00.000Z",
} as Song;

describe("usePlayerStore.syncPlaybackState", () => {
	let emit: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		emit = vi.fn();
		useChatStore.setState({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			socket: { auth: { userId: "user-1" }, emit } as any,
		});
		usePlayerStore.setState({
			currentSong: song,
			isPlaying: false,
			queue: [song],
			currentIndex: 0,
		});
	});

	it("updates isPlaying and emits update_activity with 'Playing ...' when turning playback on", () => {
		usePlayerStore.getState().syncPlaybackState(true);

		expect(usePlayerStore.getState().isPlaying).toBe(true);
		expect(emit).toHaveBeenCalledTimes(1);
		expect(emit).toHaveBeenCalledWith("update_activity", {
			userId: "user-1",
			activity: "Playing Test Track by Test Artist",
		});
	});

	it("updates isPlaying and emits update_activity with 'Idle' when turning playback off", () => {
		usePlayerStore.setState({ isPlaying: true });
		emit.mockClear();

		usePlayerStore.getState().syncPlaybackState(false);

		expect(usePlayerStore.getState().isPlaying).toBe(false);
		expect(emit).toHaveBeenCalledWith("update_activity", {
			userId: "user-1",
			activity: "Idle",
		});
	});

	it("is a no-op (does not re-emit or change state) when called with the value it already has", () => {
		expect(usePlayerStore.getState().isPlaying).toBe(false);

		usePlayerStore.getState().syncPlaybackState(false);

		expect(emit).not.toHaveBeenCalled();
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it("does not emit when the socket has no auth (not connected)", () => {
		useChatStore.setState({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			socket: { auth: null, emit } as any,
		});

		usePlayerStore.getState().syncPlaybackState(true);

		expect(emit).not.toHaveBeenCalled();
		expect(usePlayerStore.getState().isPlaying).toBe(true);
	});

	it("emits 'Idle' when turning playback on but there is no currentSong", () => {
		usePlayerStore.setState({ currentSong: null });

		usePlayerStore.getState().syncPlaybackState(true);

		expect(emit).toHaveBeenCalledWith("update_activity", {
			userId: "user-1",
			activity: "Idle",
		});
	});
});
