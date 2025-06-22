import Song from "../models/song.model.js";

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

    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  try {
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

    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
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

    res.json(songs);
  } catch (error) {
    console.error("Error in getFeaturedSongs:", error);
    next(error);
  }
};
