import NodeCache from "node-cache";
import {prisma} from "../lib/prisma.js";
import {getRandomSongs} from "../lib/randomSongs.js";
import {toClientShape} from "../lib/serialize.js";

// Shared with admin.controller.js for flush-on-mutation invalidation.
// Single-process cache: not safe across multiple Render instances.
export const homeQueryCache = new NodeCache({stdTTL: 90, checkperiod: 120});

export const getAllSongs = async (req, res, next) => {
  try {
    // -1 = descending order -> newest to oldest
    // 1 = ascending order -> oldest to newest
    const limit = parseInt(req.query.limit, 10);
    const skip = parseInt(req.query.skip, 10);

    const findArgs = {orderBy: {createdAt: "desc"}};
    if (Number.isInteger(limit) && limit > 0) {
      const validSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0;
      findArgs.skip = validSkip;
      findArgs.take = Math.min(limit, 100);
    }

    const songs = await prisma.song.findMany(findArgs);
    res.json(toClientShape(songs));
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
    const songs = toClientShape(await getRandomSongs(6));
    console.log(`[timing] getFeaturedSongs Postgres query: ${Date.now() - start}ms`);

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
    const songs = toClientShape(await getRandomSongs(4));
    console.log(`[timing] getMadeForYouSongs Postgres query: ${Date.now() - start}ms`);

    homeQueryCache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error("Error in getMadeForYouSongs:", error);
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
    const songs = toClientShape(await getRandomSongs(4));
    console.log(`[timing] getTrendingSongs Postgres query: ${Date.now() - start}ms`);

    homeQueryCache.set(cacheKey, songs);
    res.json(songs);
  } catch (error) {
    console.error("Error in getTrendingSongs:", error);
    next(error);
  }
};
