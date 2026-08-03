import {prisma} from "../lib/prisma.js";

export const getStats = async (req, res, next) => {
  try {
    const [totalSongs, totalUsers, totalAlbums, uniqueArtists] =
      await Promise.all([
        prisma.song.count(),
        prisma.user.count(),
        prisma.album.count(),
        prisma.$queryRaw`
          SELECT COUNT(DISTINCT artist)::int AS count
          FROM (
            SELECT artist FROM songs
            UNION
            SELECT artist FROM albums
          ) AS combined_artists
        `,
      ]);

    res.status(200).json({
      totalSongs,
      totalUsers,
      totalAlbums,
      totalArtists: uniqueArtists[0].count || 0,
    });
  } catch (error) {
    console.error("Error in stats route:", error);
    next(error);
  }
};
