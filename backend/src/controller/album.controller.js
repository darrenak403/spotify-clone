import Album from "../models/album.model.js";

export const getAllAlbums = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    const skip = parseInt(req.query.skip, 10);

    let query = Album.find();
    if (Number.isInteger(limit) && limit > 0) {
      const validSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0;
      query = query.skip(validSkip).limit(Math.min(limit, 100));
    }

    const albums = await query.lean();
    res.status(200).json(albums);
  } catch (error) {
    next(error);
  }
};

export const getAlbumById = async (req, res, next) => {
  try {
    const {albumId} = req.params;
    console.log("Album ID:", albumId);

    const album = await Album.findById(albumId).populate("songs").lean();

    if (!album) {
      return res.status(404).json({message: "Album not found"});
    }

    res.status(200).json(album);
  } catch (error) {
    next(error);
  }
};
