import { describe, it, expect, beforeEach, vi } from "vitest";

const configure = vi.fn().mockResolvedValue(undefined);
const preload = vi.fn().mockResolvedValue(undefined);
const unload = vi.fn().mockResolvedValue(undefined);
const play = vi.fn().mockResolvedValue(undefined);
const pause = vi.fn().mockResolvedValue(undefined);
const resume = vi.fn().mockResolvedValue(undefined);
const stop = vi.fn().mockResolvedValue(undefined);
const setCurrentTime = vi.fn().mockResolvedValue(undefined);
const setVolume = vi.fn().mockResolvedValue(undefined);
const getDuration = vi.fn().mockResolvedValue({ duration: 200 });
const addListener = vi.fn().mockResolvedValue({ remove: vi.fn() });

vi.mock("@capgo/capacitor-native-audio", () => ({
	NativeAudio: {
		configure,
		preload,
		unload,
		play,
		pause,
		resume,
		stop,
		setCurrentTime,
		setVolume,
		getDuration,
		addListener,
	},
}));

// Import after mocking so the module under test picks up the mocked NativeAudio.
const { NativeAudioEngine } = await import("./NativeAudioEngine");

describe("NativeAudioEngine", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		configure.mockResolvedValue(undefined);
		preload.mockResolvedValue(undefined);
		unload.mockResolvedValue(undefined);
		play.mockResolvedValue(undefined);
		pause.mockResolvedValue(undefined);
		resume.mockResolvedValue(undefined);
		stop.mockResolvedValue(undefined);
		setCurrentTime.mockResolvedValue(undefined);
		setVolume.mockResolvedValue(undefined);
		getDuration.mockResolvedValue({ duration: 200 });
		addListener.mockResolvedValue({ remove: vi.fn() });
	});

	it("configures the native plugin on construction", () => {
		new NativeAudioEngine();
		expect(configure).toHaveBeenCalledWith({
			focus: true,
			background: true,
			showNotification: true,
		});
	});

	it("load() happy path preloads the asset and reports duration", async () => {
		const engine = new NativeAudioEngine();
		const durationCb = vi.fn();
		engine.onDurationChange(durationCb);

		await engine.load("https://example.com/song.mp3", { title: "Song A" });

		expect(preload).toHaveBeenCalledWith(
			expect.objectContaining({
				assetId: "current-track",
				assetPath: "https://example.com/song.mp3",
				isUrl: true,
			})
		);
		expect(unload).not.toHaveBeenCalled(); // nothing was previously loaded
		expect(getDuration).toHaveBeenCalledWith({ assetId: "current-track" });
		expect(durationCb).toHaveBeenCalledWith(200);
		expect(engine.getDuration()).toBe(200);
	});

	it("load() unloads a previously-loaded asset before preloading the new one", async () => {
		const engine = new NativeAudioEngine();

		await engine.load("https://example.com/first.mp3");
		await engine.load("https://example.com/second.mp3");

		expect(unload).toHaveBeenCalledTimes(1);
		expect(unload).toHaveBeenCalledWith({ assetId: "current-track" });
		expect(preload).toHaveBeenCalledTimes(2);
	});

	it("play() calls NativeAudio.play() on first start and resume() on subsequent starts", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");

		await engine.play();
		expect(play).toHaveBeenCalledTimes(1);
		expect(resume).not.toHaveBeenCalled();
		expect(engine.isPlaying()).toBe(true);

		await engine.pause();
		expect(pause).toHaveBeenCalledTimes(1);
		expect(engine.isPlaying()).toBe(false);

		await engine.play();
		expect(play).toHaveBeenCalledTimes(1); // still only once
		expect(resume).toHaveBeenCalledTimes(1);
		expect(engine.isPlaying()).toBe(true);
	});

	it("play() is a no-op when nothing has been loaded", async () => {
		const engine = new NativeAudioEngine();
		await engine.play();

		expect(play).not.toHaveBeenCalled();
		expect(resume).not.toHaveBeenCalled();
		expect(engine.isPlaying()).toBe(false);
	});

	it("play() is a no-op when already playing (playingState guard)", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");
		await engine.play();
		await engine.play();

		expect(play).toHaveBeenCalledTimes(1);
	});

	it("pause() is a no-op when not currently playing", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");
		await engine.pause();

		expect(pause).not.toHaveBeenCalled();
	});

	describe("serialization of concurrent calls (race-condition fix)", () => {
		it("two rapid load() calls execute their native preload/unload calls in strict call order, not interleaved", async () => {
			const order: string[] = [];

			// Make preload resolve out of natural order to prove serialization forces order anyway:
			// first call's preload resolves later than the second call's would, but the queue
			// must still force the second call's preload to be issued only after the first
			// call's entire task (including its preload) has completed.
			preload.mockImplementation(async (opts: { assetPath: string }) => {
				order.push(`preload:start:${opts.assetPath}`);
				if (opts.assetPath === "first.mp3") {
					// Delay the first call's preload resolution.
					await new Promise((resolve) => setTimeout(resolve, 20));
				}
				order.push(`preload:end:${opts.assetPath}`);
			});

			const engine = new NativeAudioEngine();

			// Fire both loads without awaiting the first.
			const p1 = engine.load("first.mp3");
			const p2 = engine.load("second.mp3");

			await Promise.all([p1, p2]);

			// The second call's preload must not start until the first call's task
			// (including its own preload) has fully finished.
			expect(order).toEqual([
				"preload:start:first.mp3",
				"preload:end:first.mp3",
				"preload:start:second.mp3",
				"preload:end:second.mp3",
			]);

			// unload should have been invoked once, for the second load's cleanup of the first asset.
			expect(unload).toHaveBeenCalledTimes(1);
		});

		it("a play() issued right after two rapid load() calls acts on the most-recently-loaded asset", async () => {
			const engine = new NativeAudioEngine();

			getDuration
				.mockResolvedValueOnce({ duration: 100 }) // first load
				.mockResolvedValueOnce({ duration: 250 }); // second load

			const p1 = engine.load("first.mp3");
			const p2 = engine.load("second.mp3");
			const p3 = engine.play();

			await Promise.all([p1, p2, p3]);

			// Duration cache reflects the second (most recent) load, proving load #2's
			// task fully completed (including its getDuration/durationCallback update)
			// before play() acted.
			expect(engine.getDuration()).toBe(250);
			expect(preload).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({ assetPath: "first.mp3" })
			);
			expect(preload).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({ assetPath: "second.mp3" })
			);
			// play() should have started playback only once, after both loads settled.
			expect(play).toHaveBeenCalledTimes(1);
			expect(engine.isPlaying()).toBe(true);
		});

		it("rapid load/play/pause calls all resolve without throwing and settle in a consistent final state", async () => {
			const engine = new NativeAudioEngine();

			const calls = [
				engine.load("a.mp3"),
				engine.load("b.mp3"),
				engine.play(),
				engine.pause(),
				engine.play(),
			];

			await expect(Promise.all(calls)).resolves.toBeDefined();
			expect(engine.isPlaying()).toBe(true);
		});
	});

	it("seek() forwards to setCurrentTime and updates the cached current time", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");

		await engine.seek(42);

		expect(setCurrentTime).toHaveBeenCalledWith({ assetId: "current-track", time: 42 });
		expect(engine.getCurrentTime()).toBe(42);
	});

	it("seek() is a no-op when nothing has been loaded", async () => {
		const engine = new NativeAudioEngine();
		await engine.seek(42);

		expect(setCurrentTime).not.toHaveBeenCalled();
	});

	it("setVolume() clamps to the plugin's accepted [0.1, 1.0] range", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");

		await engine.setVolume(0);
		expect(setVolume).toHaveBeenLastCalledWith({ assetId: "current-track", volume: 0.1 });

		await engine.setVolume(1.5);
		expect(setVolume).toHaveBeenLastCalledWith({ assetId: "current-track", volume: 1 });

		await engine.setVolume(0.5);
		expect(setVolume).toHaveBeenLastCalledWith({ assetId: "current-track", volume: 0.5 });
	});

	it("stop() calls NativeAudio.stop() and resets playing/started state", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");
		await engine.play();

		await engine.stop();

		expect(stop).toHaveBeenCalledWith({ assetId: "current-track" });
		expect(engine.isPlaying()).toBe(false);

		// Since hasStartedOnce was reset, playing again should call play() (not resume()).
		await engine.play();
		expect(play).toHaveBeenCalledTimes(2);
	});

	it("destroy() removes listeners and unloads a loaded asset", async () => {
		const engine = new NativeAudioEngine();
		await engine.load("https://example.com/song.mp3");

		engine.destroy();

		// destroy() routes its unload through the same serialized queue as
		// every other operation, so it settles asynchronously.
		await vi.waitFor(() => expect(unload).toHaveBeenCalled());
	});

	it("'complete' listener event resets playing state and invokes ended/state callbacks", async () => {
		const engine = new NativeAudioEngine();
		const endedCb = vi.fn();
		const stateCb = vi.fn();
		engine.onEnded(endedCb);
		engine.onPlaybackStateChanged(stateCb);

		await engine.load("https://example.com/song.mp3");
		await engine.play();

		const completeHandler = addListener.mock.calls.find((c) => c[0] === "complete")?.[1];
		expect(completeHandler).toBeTypeOf("function");
		completeHandler({ assetId: "current-track" });

		expect(endedCb).toHaveBeenCalledTimes(1);
		expect(stateCb).toHaveBeenCalledWith(false);
		expect(engine.isPlaying()).toBe(false);
	});
});
