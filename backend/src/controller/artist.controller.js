import {prisma} from "../lib/prisma.js";
import {slugify} from "../lib/slugify.js";

// Artists are not a stored entity — they're derived from the `artist`
// string already on Song/Album, grouped by slug so name-casing/diacritic
// variants of the same artist merge onto one page (see phase-04 plan notes).
export const getArtistBySlug = async (req, res, next) => {
  try {
    const {slug} = req.params;

    const [albumArtists, songArtists] = await Promise.all([
      prisma.album.findMany({distinct: ["artist"], select: {artist: true}}),
      prisma.song.findMany({distinct: ["artist"], select: {artist: true}}),
    ]);

    const allNames = new Set([
      ...albumArtists.map((a) => a.artist),
      ...songArtists.map((s) => s.artist),
    ]);

    const matchingNames = [...allNames].filter(
      (name) => slugify(name) === slug
    );

    if (matchingNames.length === 0) {
      return res.status(404).json({message: "Artist not found"});
    }

    const [albums, standaloneSongs] = await Promise.all([
      prisma.album.findMany({
        where: {artist: {in: matchingNames}},
        include: {songs: true},
        orderBy: {releaseYear: "desc"},
      }),
      prisma.song.findMany({
        where: {artist: {in: matchingNames}, albumId: null},
        orderBy: {createdAt: "desc"},
      }),
    ]);

    const latestUpdatedAt = [...albums, ...standaloneSongs].reduce(
      (latest, record) =>
        record.updatedAt > latest ? record.updatedAt : latest,
      new Date(0)
    );

    res.status(200).json({
      slug,
      name: matchingNames[0],
      albums: albums.map(({id, title, slug, imageUrl, releaseYear, songs}) => ({
        _id: id,
        title,
        slug,
        imageUrl,
        releaseYear,
        songCount: songs.length,
      })),
      standaloneSongs: standaloneSongs.map(({id, title, imageUrl, duration}) => ({
        _id: id,
        title,
        imageUrl,
        duration,
      })),
      updatedAt: latestUpdatedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
