import {Router} from "express";
import {getAlbumById, getAllAlbums} from "../controller/album.controller.js";
// import {getAdmin} from "../controller/admin.controller.js";

const router = Router();

// Add a handler function for the route
router.get("/", getAllAlbums);
router.get("/:albumId", getAlbumById);

export default router;
