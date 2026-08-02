import {Router} from "express";
import {verifyFirebaseToken, requireFirebaseAdmin} from "../middleware/firebaseAuth.middleware.js";
import {
  checkAdmin,
  createAlbum,
  createSong,
  deleteAlbum,
  deleteSong,
} from "../controller/admin.controller.js";

const router = Router();

router.use(verifyFirebaseToken, requireFirebaseAdmin);

router.get("/check", checkAdmin);
router.post("/songs", createSong);
router.delete("/songs/:id", deleteSong);
router.post("/albums", createAlbum);
router.delete("/albums/:id", deleteAlbum);

export default router;
