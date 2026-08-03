import {prisma} from "./prisma.js";

// Plain unbiased sampling — acceptable full-table-scan cost at the app's
// current ~500-song scale (see plans/postgres-migration/phase-03-random-sampling-home-endpoints.md).
// Uses the tagged-template form so `n` is passed as a bound parameter, never interpolated into SQL text.
export const getRandomSongs = async (n) => {
  return prisma.$queryRaw`
    SELECT id, title, artist, "imageUrl", "audioUrl"
    FROM songs
    ORDER BY random()
    LIMIT ${n}
  `;
};
