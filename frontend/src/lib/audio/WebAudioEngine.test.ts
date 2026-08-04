import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebAudioEngine } from "./WebAudioEngine";

describe("WebAudioEngine", () => {
	let engine: WebAudioEngine;

	beforeEach(() => {
		engine = new WebAudioEngine();
	});

	it("constructs without throwing and starts not playing", () => {
		expect(engine.isPlaying()).toBe(false);
		expect(engine.getCurrentTime()).toBe(0);
		expect(engine.getDuration()).toBe(0);
	});

	it("fires onEnded callback when the underlying audio dispatches 'ended'", () => {
		const cb = vi.fn();
		engine.onEnded(cb);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		audio.dispatchEvent(new Event("ended"));

		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("fires onPlaybackStateChanged(true) on 'play' and (false) on 'pause'", () => {
		const cb = vi.fn();
		engine.onPlaybackStateChanged(cb);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		audio.dispatchEvent(new Event("play"));
		audio.dispatchEvent(new Event("pause"));

		expect(cb).toHaveBeenNthCalledWith(1, true);
		expect(cb).toHaveBeenNthCalledWith(2, false);
	});

	it("fires onTimeUpdate with current audio.currentTime on 'timeupdate'", () => {
		const cb = vi.fn();
		engine.onTimeUpdate(cb);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		Object.defineProperty(audio, "currentTime", { value: 42, writable: true, configurable: true });
		audio.dispatchEvent(new Event("timeupdate"));

		expect(cb).toHaveBeenCalledWith(42);
	});

	it("fires onDurationChange with audio.duration on 'loadedmetadata'", () => {
		const cb = vi.fn();
		engine.onDurationChange(cb);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		Object.defineProperty(audio, "duration", { value: 187.5, writable: true, configurable: true });
		audio.dispatchEvent(new Event("loadedmetadata"));

		expect(cb).toHaveBeenCalledWith(187.5);
	});

	it("does not throw when no callbacks have been registered and events fire", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		expect(() => {
			audio.dispatchEvent(new Event("ended"));
			audio.dispatchEvent(new Event("play"));
			audio.dispatchEvent(new Event("pause"));
			audio.dispatchEvent(new Event("timeupdate"));
			audio.dispatchEvent(new Event("loadedmetadata"));
		}).not.toThrow();
	});

	describe("setVolume clamping", () => {
		it("clamps values above 1 down to 1", async () => {
			await engine.setVolume(1.5);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((engine as any).audio.volume).toBe(1);
		});

		it("clamps values below 0 up to 0", async () => {
			await engine.setVolume(-0.5);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((engine as any).audio.volume).toBe(0);
		});

		it("passes through in-range values unchanged", async () => {
			await engine.setVolume(0.35);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((engine as any).audio.volume).toBeCloseTo(0.35);
		});
	});

	it("load() sets src and resets currentTime to 0", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		Object.defineProperty(audio, "currentTime", { value: 10, writable: true, configurable: true });

		await engine.load("https://example.com/track.mp3");

		expect(audio.src).toBe("https://example.com/track.mp3");
		expect(audio.currentTime).toBe(0);
	});

	it("stop() pauses and resets currentTime", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		const pauseSpy = vi.spyOn(audio, "pause");
		Object.defineProperty(audio, "currentTime", { value: 55, writable: true, configurable: true });

		await engine.stop();

		expect(pauseSpy).toHaveBeenCalled();
		expect(audio.currentTime).toBe(0);
	});

	it("destroy() pauses and clears src", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const audio = (engine as any).audio as HTMLAudioElement;
		const pauseSpy = vi.spyOn(audio, "pause");

		engine.destroy();

		expect(pauseSpy).toHaveBeenCalled();
		// jsdom resolves an empty src assignment against the document base URI,
		// so assert the underlying attribute was cleared rather than the resolved URL.
		expect(audio.getAttribute("src")).toBe("");
	});
});
