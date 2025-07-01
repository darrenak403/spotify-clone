import Song from "../models/song.model.js";
import Album from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js"; //assuming you have a cloudinary config file
import {clerkClient} from "@clerk/clerk-sdk-node"; // Thêm dòng này nếu chưa có

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

    const song = new Song({
      title,
      artist,
      audioUrl,
      imageUrl,
      duration,
      album: albumId || null,
    });

    await song.save();

    //if song belongs to an album, update the album's songs array
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, {$push: {songs: song._id}});
    }
    res.status(201).json({
      message: "Song created successfully",
      song,
    });
  } catch (error) {
    console.error("Error creating song:", error);
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const {id} = req.params._id || req.params.id || req.params;

    const song = await Song.findById(id);

    //if song belongs to an album, remove it from the album's songs array
    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, {$pull: {songs: song._id}});
    }
    await Song.findByIdAndDelete(id);

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

    const album = new Album({
      title,
      artist,
      imageUrl,
      releaseYear,
    });

    await album.save();

    res.status(201).json({
      message: "Album created successfully",
      album,
    });
  } catch (error) {
    console.error("Error creating album:", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const {id} = req.params._id || req.params.id || req.params;

    await Song.deleteMany({album: id}); //delete all songs in the album
    await Album.findByIdAndDelete(id);
    res.status(200).json({
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    next(error);
  }
};

export const checkAdmin = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      return res
        .status(401)
        .json({isAdmin: false, message: "No userId in token"});
    }

    const user = await clerkClient.users.getUser(userId);
    // Tìm email theo primaryEmailAddressId
    let userEmail;
    if (user.primaryEmailAddressId && user.emailAddresses) {
      const primaryEmailObj = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      );
      userEmail = primaryEmailObj?.emailAddress;
    }
    // Nếu không tìm được, fallback lấy email đầu tiên
    if (!userEmail && user.emailAddresses?.length > 0) {
      userEmail = user.emailAddresses[0].emailAddress;
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    console.log("Clerk user email:", userEmail);
    console.log("ADMIN_EMAIL:", adminEmail);

    if (userEmail === adminEmail) {
      return res.json({isAdmin: true});
    }
    return res
      .status(403)
      .json({isAdmin: false, message: "Forbidden - you must be an admin"});
  } catch (error) {
    console.error("Error checking admin:", error);
    return res
      .status(500)
      .json({isAdmin: false, message: "Internal server error"});
  }
};
