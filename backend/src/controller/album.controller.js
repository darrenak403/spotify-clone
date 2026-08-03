import {prisma} from "../lib/prisma.js";
import {isUuid} from "../lib/isUuid.js";
import {toClientShape} from "../lib/serialize.js";

export const getAllAlbums = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    const skip = parseInt(req.query.skip, 10);

    const findArgs = {};
    if (Number.isInteger(limit) && limit > 0) {
      const validSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0;
      findArgs.skip = validSkip;
      findArgs.take = Math.min(limit, 100);
    }

    const albums = await prisma.album.findMany(findArgs);
    res.status(200).json(toClientShape(albums));
  } catch (error) {
    next(error);
  }
};

export const getAlbumById = async (req, res, next) => {
  try {
    const {albumId} = req.params;

    if (!isUuid(albumId)) {
      return res.status(404).json({message: "Album not found"});
    }

    const album = await prisma.album.findUnique({
      where: {id: albumId},
      include: {songs: true},
    });

    if (!album) {
      return res.status(404).json({message: "Album not found"});
    }

    res.status(200).json(toClientShape(album));
  } catch (error) {
    next(error);
  }
};
