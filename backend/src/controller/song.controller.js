import NodeCache from "node-cache";
import Song from "../models/song.model.js";

// Shared with admin.controller.js for flush-on-mutation invalidation.
// Single-process cache: not safe across multiple Render instances.
export const homeQueryCache = new NodeCache({stdTTL: 90, checkperiod: 120});

export const getAllSongs = async (req, res, next) => {
  try {
    // -1 = descending order -> newest to oldest
    // 1 = ascending order -> oldest to newest
    const songs = await Song.find().sort({createdAt: -1});
    res.json(songs);
  } catch (error) {
    console.error("Error in getAllSongs:", error);
    next(error);
  }
};

export const getFeaturedSongs = async (req, res, next) => {
  try {
    const cacheKey = "featuredSongs";
    const cached = homeQueryCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const start = Date.now();
    // fetch 6 random songs using mongodb's aggregate pipeline
    const songs = await Song.aggregate([
      {
        $sample: {size: 6},
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);
    console.log(`[timing] getFeaturedSongs Mongo query: ${Date.now() - start}ms`);

    homeQueryCache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const cacheKey = "madeForYouSongs";
    const cached = homeQueryCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const start = Date.now();
    // fetch 6 random songs using mongodb's aggregate pipeline
    const songs = await Song.aggregate([
      {
        $sample: {size: 4},
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);
    console.log(`[timing] getMadeForYouSongs Mongo query: ${Date.now() - start}ms`);

    homeQueryCache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
    const cacheKey = "trendingSongs";
    const cached = homeQueryCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const start = Date.now();
    // fetch 6 random songs using mongodb's aggregate pipeline
    const songs = await Song.aggregate([
      {
        $sample: {size: 4},
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);
    console.log(`[timing] getTrendingSongs Mongo query: ${Date.now() - start}ms`);

    homeQueryCache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};
