import {prisma} from "../lib/prisma.js";
import {isUuid} from "../lib/isUuid.js";
import {toClientShape} from "../lib/serialize.js";
import {slugify} from "../lib/slugify.js";
import cloudinary from "../lib/cloudinary.js"; //assuming you have a cloudinary config file
import {homeQueryCache} from "./song.controller.js";

// Creates the album with a unique slug, retrying the write itself on a
// unique-constraint violation (Prisma P2002) rather than a racy
// check-then-write pre-check — closes the window where two concurrent
// creates with the same title could both pass a pre-check and collide.
const createAlbumWithUniqueSlug = async (data) => {
  const base = slugify(data.title) || "album";
  let candidate = base;
  let attempt = 1;

  while (true) {
    try {
      return await prisma.album.create({data: {...data, slug: candidate}});
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
        attempt += 1;
        candidate = `${base}-${attempt}`;
        continue;
      }
      throw error;
    }
  }
};

//helper function to upload files to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto", //to handle different file types
    });
    return result.secure_url; //return the secure URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Cloudinary upload failed");
  }
};

export const createSong = async (req, res, next) => {
  try {
    if (!req.files || !req.files.audioFile || !req.files.imageFile) {
      return res
        .status(400)
        .json({message: "Audio and image files are required."});
    }

    const {title, artist, albumId, duration} = req.body;
    const audioFile = req.files.audioFile;
    const imageFile = req.files.imageFile;

    const audioUrl = await uploadToCloudinary(audioFile);
    const imageUrl = await uploadToCloudinary(imageFile);

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        audioUrl,
        imageUrl,
        duration: Number(duration),
        albumId: albumId || null,
      },
    });

    homeQueryCache.flushAll();

    res.status(201).json({
      message: "Song created successfully",
      song: toClientShape(song),
    });
  } catch (error) {
    console.error("Error creating song:", error);
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const {id} = req.params;

    if (!isUuid(id)) {
      return res.status(404).json({message: "Song not found"});
    }

    const song = await prisma.song.findUnique({where: {id}});
    if (!song) {
      return res.status(404).json({message: "Song not found"});
    }

    await prisma.song.delete({where: {id}});

    homeQueryCache.flushAll();

    res.status(200).json({
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    const {title, artist, releaseYear} = req.body;
    const {imageFile} = req.files;

    const imageUrl = await uploadToCloudinary(imageFile);

    if (!title || !artist || !releaseYear) {
      return res
        .status(400)
        .json({message: "Title, artist, and release year are required."});
    }

    const album = await createAlbumWithUniqueSlug({
      title,
      artist,
      imageUrl,
      releaseYear: Number(releaseYear),
    });

    homeQueryCache.flushAll();

    res.status(201).json({
      message: "Album created successfully",
      album: toClientShape(album),
    });
  } catch (error) {
    console.error("Error creating album:", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const {id} = req.params;

    if (!isUuid(id)) {
      return res.status(404).json({message: "Album not found"});
    }

    const album = await prisma.album.findUnique({where: {id}});
    if (!album) {
      return res.status(404).json({message: "Album not found"});
    }

    await prisma.song.deleteMany({where: {albumId: id}}); //delete all songs in the album
    await prisma.album.delete({where: {id}});

    homeQueryCache.flushAll();

    res.status(200).json({
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    next(error);
  }
};

// requireFirebaseAdmin middleware already rejects non-admins before this
// handler runs, so reaching here means the caller's Firebase custom claim
// (admin: true) has already been verified.
export const checkAdmin = async (req, res) => {
  return res.status(200).json({isAdmin: true});
};
